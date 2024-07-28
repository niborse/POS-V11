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


        

        // Filter data based on slicers
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
        
        function forecastSales(data, futureX) {
            const result = regression.linear(data);
            const { equation } = result; // [m, b] for y = mx + b
            const forecastedY = equation[0] * futureX + equation[1];
            return forecastedY;
        }


        // Function to update charts with filtered data
        function updateCharts(filteredSalesData) {
            const timestamps = filteredSalesData.map(sale => sale.timestamp);
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

            const revenuePerProduct = filteredSalesData.reduce((acc, sale) => {
                sale.itemsSold.forEach(item => {
                    if (item.itemName) {
                        acc[item.itemName] = (acc[item.itemName] || 0) + (item.quantity * item.price);
                    }
                });
                return acc;
            }, {});

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

            //
            if (salesTrendsChart) {
                salesTrendsChart.data.labels = timestamps;
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
            if (totalSalesElement) {
                totalSalesElement.textContent = filteredSalesData.reduce((sum, sale) => sum + sale.totalAmount, 0).toFixed(2);
            } else {
                console.error("Element with ID 'totalSales' not found");
            }
    
            if (numTransactionsElement) {
                numTransactionsElement.textContent = filteredSalesData.length;
            } else {
                console.error("Element with ID 'numTransactions' not found");
            }
    
            if (avgTransactionValueElement) {
                const totalSales = filteredSalesData.reduce((sum, sale) => sum + sale.totalAmount, 0);
                const avgTransactionValue = totalSales / filteredSalesData.length || 0;
                avgTransactionValueElement.textContent = avgTransactionValue.toFixed(2);
            } else {
                console.error("Element with ID 'avgTransactionValue' not found");
            }

            // Calculate items sold counts
           
        }

        
        

        // Top-Selling Products Chart
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
        // Sales Trends Chart
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
                labels: timestamps,
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


        
        
        

        

        // Placeholder for Forecasting and Customer Insights (implement these similarly)

        // Listen for storage changes and update charts
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
