function versusApp() {
    const API_URL = window.API_URL || 'http://localhost:3000';
    
    return {
        drivers: [],
        driver1: '',
        driver2: '',
        driverStats: {},
        loading: true,
        error: null,

        async shareComparison() {
            try {
                this.loading = true;
                const container = document.getElementById('comparison-container');
                
                // Generate image
                const canvas = await html2canvas(container, {
                    scale: 2, // Higher quality
                    backgroundColor: '#f8f9fa',
                    logging: false,
                    useCORS: true
                });

                // Convert to blob
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
                
                // Create share data
                const shareData = {
                    title: 'Comparación de Pilotos F1',
                    text: `Comparación entre ${this.driverStats[this.driver1]?.name} y ${this.driverStats[this.driver2]?.name} en la temporada actual de F1`,
                    files: [new File([blob], 'comparison.png', { type: 'image/png' })]
                };

                // Try to use Web Share API
                if (navigator.share && navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                } else {
                    // Fallback: Download image
                    const link = document.createElement('a');
                    link.download = 'comparison.png';
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                }
            } catch (error) {
                console.error('Error sharing comparison:', error);
                this.error = 'Error al compartir la comparación';
            } finally {
                this.loading = false;
            }
        },

        async init() {
            try {
                this.loading = true;
                // Fetch drivers from API
                const response = await fetch(`${API_URL}/api/drivers`);
                const driversData = await response.json();
                
                // Transform drivers data
                this.drivers = driversData.map(driver => ({
                    id: driver.driverId,
                    name: `${driver.name} ${driver.surname}`,
                    shortName: driver.shortName,
                    team: driver.teamName,
                    points: driver.points,
                    position: driver.position,
                    wins: driver.wins
                }));

                this.loading = false;
            } catch (error) {
                console.error('Error initializing app:', error);
                this.error = 'Error cargando datos de pilotos';
                this.loading = false;
            }
        },

        async updateDriverStats() {
            if (!this.driver1 || !this.driver2) return;

            try {
                this.loading = true;
                // Get head-to-head stats
                const statsResponse = await fetch(`${API_URL}/api/driver-stats/${this.driver1}/${this.driver2}`);
                const statsData = await statsResponse.json();

                // Get drivers' basic info
                const driver1Data = this.drivers.find(d => d.id === this.driver1);
                const driver2Data = this.drivers.find(d => d.id === this.driver2);

                // Update stats with combined data
                this.driverStats = {
                    [this.driver1]: {
                        name: driver1Data.name,
                        team: driver1Data.team,
                        position: driver1Data.position,
                        points: driver1Data.points,
                        positionWins: statsData.position[this.driver1],
                        gridWins: statsData.grid[this.driver1]
                    },
                    [this.driver2]: {
                        name: driver2Data.name,
                        team: driver2Data.team,
                        position: driver2Data.position,
                        points: driver2Data.points,
                        positionWins: statsData.position[this.driver2],
                        gridWins: statsData.grid[this.driver2]
                    }
                };

                this.loading = false;
            } catch (error) {
                console.error('Error updating driver stats:', error);
                this.error = 'Error cargando estadísticas de comparación';
                this.loading = false;
            }
        },

        getDriverStats(driverId) {
            return this.driverStats[driverId];
        }
    };
}
