// Constants for Azure Storage connection
const storageAccount = "foodwastestorageacc";
// Replace the entire sasToken definition with this exact format
const sasToken = "?sv=2024-11-04&ss=b&srt=co&sp=rwlactfx&se=2025-05-14T01:55:38Z&st=2025-04-13T17:55:38Z&spr=https&sig=gf%2FVNKz9ktIWIx04vI%2Fdq3CzYIsz8kvNvK%2FdUNaPNao%3D";

// Sample data for development/testing since we don't have real data yet
const sampleData = [
    {
        dishName: "Grilled Salmon",
        portionSize: "large",
        mealTime: "dinner",
        analysis: {
            wastePercentage: 18,
            wasteCategory: "low",
            confidenceScore: 0.82
        },
        timestamp: "2025-04-12T18:32:45Z"
    },
    {
        dishName: "Caesar Salad",
        portionSize: "medium",
        mealTime: "lunch",
        analysis: {
            wastePercentage: 42,
            wasteCategory: "medium",
            confidenceScore: 0.76
        },
        timestamp: "2025-04-12T12:15:22Z"
    },
    {
        dishName: "Spaghetti Bolognese",
        portionSize: "large",
        mealTime: "dinner",
        analysis: {
            wastePercentage: 75,
            wasteCategory: "high",
            confidenceScore: 0.89
        },
        timestamp: "2025-04-11T19:45:10Z"
    },
    {
        dishName: "Avocado Toast",
        portionSize: "small",
        mealTime: "breakfast",
        analysis: {
            wastePercentage: 12,
            wasteCategory: "low",
            confidenceScore: 0.91
        },
        timestamp: "2025-04-11T08:22:30Z"
    },
    {
        dishName: "Chicken Curry",
        portionSize: "medium",
        mealTime: "dinner",
        analysis: {
            wastePercentage: 35,
            wasteCategory: "medium",
            confidenceScore: 0.78
        },
        timestamp: "2025-04-10T19:12:05Z"
    }
];

// Function to fetch analysis results
async function fetchAnalysisResults() {
    console.log("Starting to fetch results...");
    try {
      // For testing, always return sample data first
      return sampleData;
      
      /* Once Logic App is working, uncomment this section
      const url = `https://foodwastestorageacc.blob.core.windows.net/results?restype=container&comp=list${sasToken}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error("Error fetching results:", response.status);
        return sampleData;
      }
      
      // Process the response
      const xmlText = await response.text();
      console.log("Got response from Azure");
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");
      
      const blobs = Array.from(xmlDoc.getElementsByTagName("Blob"));
      if (blobs.length === 0) {
        console.log("No results found in container");
        return sampleData;
      }
      
      // Get result files
      const resultPromises = blobs.map(async (blob) => {
        const nameElement = blob.getElementsByTagName("Name")[0];
        if (!nameElement) return null;
        
        const name = nameElement.textContent;
        const blobUrl = `https://foodwastestorageacc.blob.core.windows.net/results/${name}${sasToken}`;
        
        try {
          const blobResponse = await fetch(blobUrl);
          if (!blobResponse.ok) return null;
          return await blobResponse.json();
        } catch (error) {
          console.error(`Error fetching blob ${name}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(resultPromises);
      const validResults = results.filter(r => r !== null);
      
      return validResults.length > 0 ? validResults : sampleData;
      */
    } catch (error) {
      console.error("Error in fetchAnalysisResults:", error);
      return sampleData;
    }
  }

// Calculate statistics
function calculateStatistics(data) {
    // Average waste percentage
    const totalWaste = data.reduce((sum, item) => sum + item.analysis.wastePercentage, 0);
    const avgWaste = totalWaste / data.length;
    
    // Count dishes by waste category
    const wasteCategories = {
        low: data.filter(item => item.analysis.wasteCategory === 'low').length,
        medium: data.filter(item => item.analysis.wasteCategory === 'medium').length,
        high: data.filter(item => item.analysis.wasteCategory === 'high').length
    };
    
    // Count by meal time
    const mealTimes = {
        breakfast: data.filter(item => item.mealTime === 'breakfast').length,
        lunch: data.filter(item => item.mealTime === 'lunch').length,
        dinner: data.filter(item => item.mealTime === 'dinner').length
    };
    
    // Potential savings (simplified calculation)
    const avgCostPerDish = 12; // Assumed cost in dollars
    const potentialSavings = (avgWaste / 100) * avgCostPerDish * data.length * 30; // Monthly estimate
    
    return {
        totalDishes: data.length,
        avgWastePercentage: avgWaste,
        wasteCategories,
        mealTimes,
        potentialSavings
    };
}

// Create and render charts
function renderCharts(data, stats) {
    // Prepare data for waste by dish chart
    const dishGroups = {};
    data.forEach(item => {
        if (!dishGroups[item.dishName]) {
            dishGroups[item.dishName] = [];
        }
        dishGroups[item.dishName].push(item.analysis.wastePercentage);
    });
    
    const dishLabels = Object.keys(dishGroups);
    const dishData = dishLabels.map(dish => {
        const percentages = dishGroups[dish];
        return percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    });
    
    // Create waste by dish chart
    const dishCtx = document.getElementById('waste-by-dish-chart');
    if (dishCtx) {
        new Chart(dishCtx, {
            type: 'bar',
            data: {
                labels: dishLabels,
                datasets: [{
                    label: 'Waste Percentage',
                    data: dishData,
                    backgroundColor: dishData.map(value => {
                        if (value < 30) return '#27ae60'; // green
                        if (value < 70) return '#f39c12'; // yellow
                        return '#e74c3c'; // red
                    }),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Waste %'
                        }
                    }
                }
            }
        });
    }
    
    // Create waste by meal time chart
    const mealCtx = document.getElementById('waste-by-meal-chart');
    if (mealCtx) {
        new Chart(mealCtx, {
            type: 'doughnut',
            data: {
                labels: ['Breakfast', 'Lunch', 'Dinner'],
                datasets: [{
                    data: [
                        stats.mealTimes.breakfast || 0,
                        stats.mealTimes.lunch || 0, 
                        stats.mealTimes.dinner || 0
                    ],
                    backgroundColor: [
                        '#3498db', // blue
                        '#2ecc71', // green
                        '#9b59b6'  // purple
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true
            }
        });
    }
}

// Populate the dashboard with data
function populateDashboard(data) {
    // Calculate statistics
    const stats = calculateStatistics(data);
    
    // Update statistics display
    document.getElementById('total-dishes').textContent = stats.totalDishes;
    document.getElementById('avg-waste-percentage').textContent = `${Math.round(stats.avgWastePercentage)}%`;
    document.getElementById('potential-savings').textContent = `$${Math.round(stats.potentialSavings)}`;
    
    // Render charts
    renderCharts(data, stats);
    
    // Populate results table
    const tableBody = document.getElementById('results-table-body');
    if (tableBody) {
        // Sort by date (newest first)
        const sortedData = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        tableBody.innerHTML = '';
        sortedData.forEach(item => {
            const row = document.createElement('tr');
            
            // Format date
            const date = new Date(item.timestamp);
            const formattedDate = date.toLocaleDateString();
            
            // Set waste category class
            const categoryClass = `waste-${item.analysis.wasteCategory}`;
            
            row.innerHTML = `
                <td>${item.dishName}</td>
                <td>${item.portionSize.charAt(0).toUpperCase() + item.portionSize.slice(1)}</td>
                <td>${item.mealTime.charAt(0).toUpperCase() + item.mealTime.slice(1)}</td>
                <td>${item.analysis.wastePercentage}%</td>
                <td class="${categoryClass}">${item.analysis.wasteCategory.charAt(0).toUpperCase() + item.analysis.wasteCategory.slice(1)}</td>
                <td>${formattedDate}</td>
            `;
            
            tableBody.appendChild(row);
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch analysis results
    const data = await fetchAnalysisResults();
    
    // Populate dashboard with data
    populateDashboard(data);
});