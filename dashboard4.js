document.addEventListener('DOMContentLoaded', async () => {
    console.log("Dashboard loaded");

    try {
        // Fetch sales data from the backend
        const salesResponse = await fetch('http://localhost:5010/sales');
        if (!salesResponse.ok) {
            throw new Error('Network response was not ok');
        }
        const salesData = await salesResponse.json();
        console.log("Retrieved sales data:", salesData);

        // Fetch inventory data from the backend
        const inventoryResponse = await fetch('http://localhost:5010/inventory');
        if (!inventoryResponse.ok) {
            throw new Error('Network response was not ok');
        }
        const inventoryData = await inventoryResponse.json();
        console.log("Retrieved inventory data:", inventoryData);

        // Check if sales data exists
        if (salesData.length === 0) {
            console.log("No sales data found");
            return;
        }

        // Extract unique years and months from salesData
        const uniqueYears = [...new Set(salesData.map(sale => new Date(sale.timestamp).getFullYear()))];
        const uniqueMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const uniqueQuarters = ["Q1", "Q2", "Q3", "Q4"];
        
        // Populate year slicer
        const yearSlicer = document.getElementById('yearSlicer');
        if (yearSlicer) {
            const allOption = document.createElement('option');
            allOption.value = "all";
            allOption.textContent = "All";
            yearSlicer.appendChild(allOption);

            uniqueYears.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSlicer.appendChild(option);
            });
        } else {
            console.error("Element with ID 'yearSlicer' not found");
        }

        // Populate quarter slicer
        const quarterSlicer = document.getElementById('quarterSlicer');
        if (quarterSlicer) {
            const allOption = document.createElement('option');
            allOption.value = "all";
            allOption.textContent = "All";
            quarterSlicer.appendChild(allOption);

            uniqueQuarters.forEach((quarter, index) => {
                const option = document.createElement('option');
                option.value = index + 1; // Quarter index (1-based)
                option.textContent = quarter;
                quarterSlicer.appendChild(option);
            });
        } else {
            console.error("Element with ID 'quarterSlicer' not found");
        }

        // Populate month slicer
        const monthSlicer = document.getElementById('monthSlicer');
        if (monthSlicer) {
            const allOption = document.createElement('option');
            allOption.value = "all";
            allOption.textContent = "All";
            monthSlicer.appendChild(allOption);

            uniqueMonths.forEach((month, index) => {
                const option = document.createElement('option');
                option.value = index + 1; // Month index (1-based)
                option.textContent = month;
                monthSlicer.appendChild(option);
            });
        } else {
            console.error("Element with ID 'monthSlicer' not found");
        }

        // Function to calculate the moving average
        function movingAverage(data, windowSize) {
            if (data.length < windowSize) {
                throw new Error("Data length must be greater than or equal to the window size");
            }

            let movingAverages = [];
            for (let i = 0; i <= data.length - windowSize; i++) {
                let windowData = data.slice(i, i + windowSize);
                let sum = windowData.reduce((acc, val) => acc + val, 0);
                movingAverages.push(sum / windowSize);
            }

            return movingAverages;
        }
        // Function to calculate revenue per product
        function calculateRevenuePerProduct(salesData) {
            return salesData.reduce((acc, sale) => {
                sale.itemsSold.forEach(item => {
                    acc[item.itemName] = (acc[item.itemName] || 0) + (item.quantity * item.price);
                });
                return acc;
            }, {});
        }
        // Function to calculate revenue and quantity sold per product
        function calculateRevenueAndQuantity(salesData) {
            return salesData.reduce((acc, sale) => {
                sale.itemsSold.forEach(item => {
                    if (!acc[item.itemName]) {
                        acc[item.itemName] = { revenue: 0, quantity: 0 };
                    }
                    acc[item.itemName].revenue += item.quantity * item.price;
                    acc[item.itemName].quantity += item.quantity;
                });
                return acc;
            }, {});
        }

        // Function to sort and prepare data for Pareto chart
        function prepareParetoData(data) {
            // Convert to array and sort by quantity or revenue
            const sortedData = Object.entries(data).map(([key, value]) => ({
                name: key,
                ...value
            })).sort((a, b) => b.quantity - a.quantity); // Sorting by quantity

            // Calculate cumulative percentages
            const totalQuantity = sortedData.reduce((sum, item) => sum + item.quantity, 0);
            let cumulativeQuantity = 0;
            const cumulativePercentages = sortedData.map(item => {
                cumulativeQuantity += item.quantity;
                return (cumulativeQuantity / totalQuantity) * 100;
            });

            return {
                labels: sortedData.map(item => item.name),
                quantities: sortedData.map(item => item.quantity),
                revenues: sortedData.map(item => item.revenue),
                cumulativePercentages: cumulativePercentages
            };
        }


        // Function to filter data based on slicers
        function filterData() {
            const selectedYear = yearSlicer.value;
            const selectedQuarter = quarterSlicer.value;
            const selectedMonth = monthSlicer.value;
    
            let filteredSalesData = salesData;
    
            if (selectedYear !== "all") {
                filteredSalesData = filteredSalesData.filter(sale => new Date(sale.timestamp).getFullYear() == selectedYear);
            }
    
            if (selectedQuarter !== "all") {
                filteredSalesData = filteredSalesData.filter(sale => Math.floor((new Date(sale.timestamp).getMonth() + 3) / 3) == selectedQuarter);
            }
    
            if (selectedMonth !== "all") {
                filteredSalesData = filteredSalesData.filter(sale => new Date(sale.timestamp).getMonth() + 1 == selectedMonth);
            }
    
            updateCharts(filteredSalesData);
        }
    
        yearSlicer.addEventListener('change', filterData);
        quarterSlicer.addEventListener('change', filterData);
        monthSlicer.addEventListener('change', filterData);
      
        // Function to update charts with filtered data
        function updateCharts(filteredSalesData) {
            const timestamps = filteredSalesData.map(sale => new Date(sale.timestamp)); // Corrected variable name
            const totalAmounts = filteredSalesData.map(sale => sale.totalAmount);
            
        
            const itemsSoldCounts = filteredSalesData.reduce((acc, sale) => {
                sale.itemsSold.forEach(item => {
                    if (item.itemName) {
                        acc[item.itemName] = (acc[item.itemName] || 0) + item.quantity;
                    }
                });
                return acc;
            }, {});
            const paymentMethods = filteredSalesData.reduce((acc, sale) => {
                acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.totalAmount;
                return acc;
            }, {});
        
            const revenuePerProduct = calculateRevenuePerProduct(filteredSalesData);
            const revenuePerProductLabels = Object.keys(revenuePerProduct);
            const revenuePerProductData = Object.values(revenuePerProduct);

            if (revenuePerProductChart) {
                revenuePerProductChart.data.labels = revenuePerProductLabels;
                revenuePerProductChart.data.datasets[0].data = revenuePerProductData;
                revenuePerProductChart.update();
            }
        
            const getQuarter = (date) => Math.floor((date.getMonth() + 3) / 3);
            const itemsSoldPerQuarter = filteredSalesData.reduce((acc, sale) => {
                const quarter = getQuarter(new Date(sale.timestamp));
                acc[quarter] = (acc[quarter] || 0) + sale.itemsSold.reduce((sum, item) => sum + item.quantity, 0);
                return acc;
            }, {});
        
            const itemsSoldPerYear = filteredSalesData.reduce((acc, sale) => {
                const year = new Date(sale.timestamp).getFullYear();
                acc[year] = (acc[year] || 0) + sale.itemsSold.reduce((sum, item) => sum + item.quantity, 0);
                return acc;
            }, {});
        
            const itemsSoldPerMonth = filteredSalesData.reduce((acc, sale) => {
                const month = new Date(sale.timestamp).toISOString().slice(0, 7);
                acc[month] = (acc[month] || 0) + sale.itemsSold.reduce((sum, item) => sum + item.quantity, 0);
                return acc;
            }, {});
        
            if (salesTrendsChart) {
                salesTrendsChart.data.labels = timestamps; // Use the correct variable name
                salesTrendsChart.data.datasets[0].data = totalAmounts;
                salesTrendsChart.update();
            }
        
            if (topSellingProductsChart) {
                topSellingProductsChart.data.labels = Object.keys(itemsSoldCounts);
                topSellingProductsChart.data.datasets[0].data = Object.values(itemsSoldCounts);
                topSellingProductsChart.update();
            }
        
            // Real-Time Sales Data
            const totalSales = totalAmounts.reduce((acc, val) => acc + val, 0);
            const numTransactions = salesData.length;
            const avgTransactionValue = totalSales / numTransactions;
        
            document.getElementById('totalSales').textContent = totalSales.toFixed(2);
            document.getElementById('numTransactions').textContent = numTransactions;
            document.getElementById('avgTransactionValue').textContent = avgTransactionValue.toFixed(2);
            if (totalSales) {
                totalSales.textContent = filteredSalesData.reduce((sum, sale) => sum + sale.totalAmount, 0).toFixed(2);
            } else {
                console.error("Element with ID 'totalSales' not found");
            }
        
            if (numTransactions) {
                numTransactions.textContent = filteredSalesData.length;
            } else {
                console.error("Element with ID 'numTransactions' not found");
            }
        
            if (avgTransactionValue) {
                const totalSales = filteredSalesData.reduce((sum, sale) => sum + sale.totalAmount, 0);
                const avgTransactionValue = totalSales / filteredSalesData.length || 0;
                avgTransactionValue.textContent = avgTransactionValue.toFixed(2);
            } else {
                console.error("Element with ID 'avgTransactionValue' not found");
            }
        
            // Calculate Moving Average for Forecasting
            const windowSize = 3; // Adjust this value based on your preference
            const movingAverages = movingAverage(totalAmounts, windowSize);
            if (demandForecastingChart) {
                demandForecastingChart.data.labels = timestamps.slice(windowSize - 1); // Align labels with the moving average data
                demandForecastingChart.data.datasets[0].data = totalAmounts;
                demandForecastingChart.data.datasets[1].data = movingAverages;
                demandForecastingChart.update();
            }
        
            // Append the moving average data for the forecast
            if (salesTrendsChart) {
                salesTrendsChart.data.datasets.push({
                    label: 'Moving Average Forecast',
                    data: movingAverages,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    fill: false,
                });
                salesTrendsChart.update();
            }
        }
        

        // Initialize charts
        const topSellingProductsCtx = document.getElementById('topSellingProductsChart').getContext('2d');
        const topSellingProductsChart = new Chart(topSellingProductsCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Most Sold Items',
                    data: [],
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    x: {
                        beginAtZero: true
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        const salesTrendsCtx = document.getElementById('salesTrendsChart').getContext('2d');
        const salesTrendsChart = new Chart(salesTrendsCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Total Revenue',
                    data: [],
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'MMM d'
                            }
                        }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Current Inventory Levels
        const inventoryCounts = inventoryData.reduce((acc, item) => {
            acc[item.itemName] = (acc[item.itemName] || 0) + item.quantity;
            return acc;
        }, {});

        const inventoryLevelsCtx = document.getElementById('inventoryLevelsChart').getContext('2d');
        const inventoryLevelsChart = new Chart(inventoryLevelsCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(inventoryCounts),
                datasets: [{
                    label: 'Quantity in Inventory',
                    data: Object.values(inventoryCounts),
                    backgroundColor: 'rgba(153, 102, 255, 0.5)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Low Stock Alerts
        const lowStockThreshold = 5;
        const lowStockItems = inventoryData.filter(item => item.quantity <= lowStockThreshold);
        const lowStockAlertsContainer = document.getElementById('lowStockAlerts');
        lowStockItems.forEach(item => {
            const listItem = document.createElement('li');
            listItem.textContent = `${item.itemName}: ${item.quantity}`;
            lowStockAlertsContainer.appendChild(listItem);
        });

        // Stock Movement (For simplicity, assuming sales data as outgoing inventory)
        
        const stockMovementCtx = document.getElementById('stockMovementChart').getContext('2d');
        const stockMovementChart = new Chart(stockMovementCtx, {
            type: 'bar',
            data: {
                labels: [],

                datasets: [{
                    label: 'Stock Movement',
                    data: salesData.map(sale => sale.itemsSold.reduce((sum, item) => sum + item.quantity, 0)),
                    backgroundColor: 'rgba(255, 159, 64, 0.5)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'MMM d'
                            }
                        },
                        beginAtZero: true
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        const demandForecastingCtx = document.getElementById('demandForecastingChart').getContext('2d');
        const demandForecastingChart = new Chart(demandForecastingCtx, {
            type: 'line',
            data: {
                labels: [], // Will be updated with timestamps or labels
                datasets: [
                    {
                        label: 'Actual Sales',
                        data: [],
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        fill: false,
                    },
                    {
                        label: 'Moving Average Forecast',
                        data: [],
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        fill: false,
                    }
                ]
            },
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month', // Adjust this as needed
                            displayFormats: {
                                month: 'MMM YYYY'
                            }
                        }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        const revenuePerProductCtx = document.getElementById('revenuePerProductChart').getContext('2d');
        const revenuePerProductChart = new Chart(revenuePerProductCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Revenue per Product',
                    data: [],
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    x: {
                        beginAtZero: true
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        // Pareto Chart
        const revenueAndQuantityData = calculateRevenueAndQuantity(salesData);
        const paretoData = prepareParetoData(revenueAndQuantityData);

        const paretoCtx = document.getElementById('paretoChart').getContext('2d');
        const paretoChart = new Chart(paretoCtx, {
            type: 'bar',
            data: {
                labels: paretoData.labels,
                datasets: [{
                    label: 'Quantity Sold',
                    data: paretoData.quantities,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }, {
                    label: 'Revenue',
                    data: paretoData.revenues,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: true
                    }
                }
            }
        });

        
        // Placeholder for Forecasting and Customer Insights (implement these similarly)
        updateCharts(salesData);
        window.addEventListener('storage', (event) => {
            if (event.key === 'salesData' || event.key === 'inventory') {
                location.reload();
            }
        });

    } catch (error) {
        console.error('Error loading data:', error);
    }
});
