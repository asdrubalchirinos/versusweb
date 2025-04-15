function versusApp() {
    const API_URL = window.API_URL || 'http://localhost:3000';
    
    return {
        drivers: [],
        driver1: '',
        driver2: '',
        driverStats: {},
        loading: true,
        error: null,

        async downloadComparison() {
            try {
                this.loading = true;
                const container = document.getElementById('comparison-container');
                
                // Track download event
                gtag('event', 'download', {
                    'event_category': 'Driver Comparison',
                    'event_label': `${this.driverStats[this.driver1]?.name} vs ${this.driverStats[this.driver2]?.name}`,
                    'value': 1
                });
                
                // Generate image
                const canvas = await this.generateComparisonImage(container);
                
                // Download image
                const link = document.createElement('a');
                link.download = `comparison-${this.driverStats[this.driver1]?.name}-vs-${this.driverStats[this.driver2]?.name}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (error) {
                console.error('Error downloading comparison:', error);
                this.error = 'Error al descargar la comparación';
            } finally {
                this.loading = false;
            }
        },

        async generateComparisonImage(container) {
            // First capture the comparison content
            const canvas = await html2canvas(container, {
                scale: 2,
                backgroundColor: '#f8f9fa',
                logging: false,
                useCORS: true
            });

            // Create a new canvas for the final image with watermark
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = canvas.width;
            finalCanvas.height = canvas.height;
            const ctx = finalCanvas.getContext('2d');

            // Draw the original content
            ctx.drawImage(canvas, 0, 0);

            // Load and draw the watermark
            const logo = new Image();
            logo.src = 'images/watermark.png';
            
            await new Promise((resolve) => {
                logo.onload = resolve;
            });

            // Calculate watermark size while maintaining aspect ratio
            const maxSize = Math.min(canvas.width * 0.4, canvas.height * 0.4);
            const aspectRatio = logo.width / logo.height;
            let watermarkWidth, watermarkHeight;

            if (aspectRatio > 1) {
                // Logo is wider than tall
                watermarkWidth = maxSize;
                watermarkHeight = maxSize / aspectRatio;
            } else {
                // Logo is taller than wide
                watermarkHeight = maxSize;
                watermarkWidth = maxSize * aspectRatio;
            }

            // Position watermark at top center
            const x = (canvas.width - watermarkWidth) / 2;
            const y = 20; // 20px from the top

            // Draw watermark with reduced opacity
            ctx.globalAlpha = 0.5;
            ctx.drawImage(logo, x, y, watermarkWidth, watermarkHeight);
            ctx.globalAlpha = 1.0;

            return finalCanvas;
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
                    shortName: driver.shortName || driver.surname.toUpperCase(),
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

                // Track compare event
                gtag('event', 'compare', {
                    'event_category': 'Driver Comparison',
                    'event_label': `${driver1Data.name} vs ${driver2Data.name}`,
                    'value': 1
                });

                // Update stats with combined data
                this.driverStats = {
                    [this.driver1]: {
                        name: driver1Data.name,
                        shortName: driver1Data.shortName,
                        team: driver1Data.team,
                        position: driver1Data.position,
                        points: driver1Data.points,
                        positionWins: statsData.racePosition[this.driver1],
                        gridWins: statsData.qualyPosition[this.driver1],
                        wins: statsData.wins[this.driver1],
                        podiums: statsData.podiums[this.driver1],
                        poles: statsData.poles[this.driver1]
                    },
                    [this.driver2]: {
                        name: driver2Data.name,
                        shortName: driver2Data.shortName,
                        team: driver2Data.team,
                        position: driver2Data.position,
                        points: driver2Data.points,
                        positionWins: statsData.racePosition[this.driver2],
                        gridWins: statsData.qualyPosition[this.driver2],
                        wins: statsData.wins[this.driver2],
                        podiums: statsData.podiums[this.driver2],
                        poles: statsData.poles[this.driver2]
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
