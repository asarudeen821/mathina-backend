import axios from 'axios';

class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseURL = 'https://maps.googleapis.com/maps/api';
    this.isConfigured = this.apiKey && this.apiKey !== 'your_google_maps_api_key_here';
  }

  /**
   * Calculate distance and duration between two points
   * @param {object} origin - { lat, lng } or address string
   * @param {object} destination - { lat, lng } or address string
   * @returns {Promise<object>} Distance and duration
   */
  async getDistanceMatrix(origin, destination) {
    if (!this.isConfigured) {
      return this.getFallbackDistance(origin, destination);
    }

    try {
      const originStr = typeof origin === 'object' 
        ? `${origin.lat},${origin.lng}` 
        : encodeURIComponent(origin);
      const destStr = typeof destination === 'object'
        ? `${destination.lat},${destination.lng}`
        : encodeURIComponent(destination);

      const response = await axios.get(`${this.baseURL}/distancematrix/json`, {
        params: {
          origins: originStr,
          destinations: destStr,
          key: this.apiKey,
          units: 'metric',
        },
      });

      if (response.data.status === 'OK') {
        const row = response.data.rows[0];
        const element = row.elements[0];

        if (element.status === 'OK') {
          return {
            success: true,
            distance: {
              text: element.distance.text,
              value: element.distance.value, // in meters
            },
            duration: {
              text: element.duration.text,
              value: element.duration.value, // in seconds
            },
          };
        }
      }

      return this.getFallbackDistance(origin, destination);
    } catch (error) {
      console.error('Google Maps Distance Matrix error:', error);
      return this.getFallbackDistance(origin, destination);
    }
  }

  /**
   * Geocode an address to coordinates
   * @param {string} address - Address to geocode
   * @returns {Promise<object>} Coordinates
   */
  async geocodeAddress(address) {
    if (!this.isConfigured) {
      return {
        success: false,
        message: 'Google Maps API not configured',
      };
    }

    try {
      const response = await axios.get(`${this.baseURL}/geocode/json`, {
        params: {
          address: encodeURIComponent(address),
          key: this.apiKey,
        },
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          success: true,
          coordinates: {
            lat: location.lat,
            lng: location.lng,
          },
          formattedAddress: response.data.results[0].formatted_address,
        };
      }

      return {
        success: false,
        message: 'No results found',
      };
    } catch (error) {
      console.error('Geocode error:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Get delivery time estimate with monsoon consideration
   * @param {object} origin - Pickup location
   * @param {object} destination - Delivery location
   * @param {string} weather - Weather condition (optional)
   * @returns {Promise<object>} Delivery time estimate
   */
  async getDeliveryEstimate(origin, destination, weather = 'normal') {
    const distanceData = await this.getDistanceMatrix(origin, destination);

    if (!distanceData.success) {
      return {
        success: false,
        message: 'Unable to calculate delivery time',
      };
    }

    // Base delivery time calculation
    const baseDurationMinutes = Math.ceil(distanceData.duration.value / 60);
    
    // Add preparation time (15 minutes)
    let estimatedMinutes = baseDurationMinutes + 15;

    // Monsoon delay (add 30% extra time)
    if (weather === 'monsoon' || weather === 'rain') {
      estimatedMinutes = Math.ceil(estimatedMinutes * 1.3);
    }

    // Peak hours delay (add 20% extra time)
    const currentHour = new Date().getHours();
    if ((currentHour >= 9 && currentHour <= 11) || (currentHour >= 17 && currentHour <= 20)) {
      estimatedMinutes = Math.ceil(estimatedMinutes * 1.2);
    }

    return {
      success: true,
      estimatedTime: {
        minutes: estimatedMinutes,
        text: `${estimatedMinutes}-${estimatedMinutes + 15} mins`,
      },
      distance: distanceData.distance,
      baseDuration: distanceData.duration,
      delays: {
        monsoon: weather === 'monsoon' || weather === 'rain',
        peakHours: (currentHour >= 9 && currentHour <= 11) || (currentHour >= 17 && currentHour <= 20),
      },
    };
  }

  /**
   * Optimize delivery route for multiple stops
   * @param {object} start - Starting point
   * @param {array} stops - Array of delivery stops
   * @returns {Promise<array>} Optimized route
   */
  async optimizeRoute(start, stops) {
    if (!this.isConfigured || stops.length <= 1) {
      return {
        success: true,
        route: stops,
        message: 'Route optimization requires Google Maps API',
      };
    }

    // Simple nearest neighbor algorithm for route optimization
    const optimized = [start];
    const remaining = [...stops];
    let current = start;

    while (remaining.length > 0) {
      let nearest = null;
      let nearestDistance = Infinity;
      let nearestIndex = -1;

      for (let i = 0; i < remaining.length; i++) {
        const distanceData = await this.getDistanceMatrix(current, remaining[i].location);
        if (distanceData.success && distanceData.distance.value < nearestDistance) {
          nearestDistance = distanceData.distance.value;
          nearest = remaining[i];
          nearestIndex = i;
        }
      }

      if (nearest) {
        optimized.push(nearest);
        current = nearest.location;
        remaining.splice(nearestIndex, 1);
      }
    }

    return {
      success: true,
      route: optimized,
      totalStops: stops.length,
    };
  }

  /**
   * Check if address is within delivery zone
   * @param {string} address - Address to check
   * @param {array} deliveryZones - Array of serviceable areas
   * @returns {Promise<boolean>} Is deliverable
   */
  async isDeliverable(address, deliveryZones = []) {
    // Default Chennai delivery zones
    const defaultZones = [
      'T Nagar', 'Anna Nagar', 'Adyar', 'Velachery', 'Tambaram',
      'Chromepet', 'Guindy', 'Nungambakkam', 'Mylapore', 'Triplicane',
      'Egmore', 'Kilpauk', 'Ashok Nagar', 'Kodambakkam', 'Vadapalani',
    ];

    const zones = deliveryZones.length > 0 ? deliveryZones : defaultZones;

    // Check if address contains any serviceable zone
    const addressLower = address.toLowerCase();
    return zones.some(zone => addressLower.includes(zone.toLowerCase()));
  }

  /**
   * Fallback distance calculation (Chennai city average)
   * @private
   */
  getFallbackDistance(origin, destination) {
    // Assume average 5km distance within Chennai
    return {
      success: true,
      distance: {
        text: '5 km',
        value: 5000,
      },
      duration: {
        text: '20 mins',
        value: 1200,
      },
      isEstimate: true,
    };
  }

  /**
   * Test Google Maps connection
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    if (!this.isConfigured) {
      return false;
    }

    try {
      const result = await this.geocodeAddress('Chennai, India');
      return result.success;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
const googleMapsService = new GoogleMapsService();
export default googleMapsService;
