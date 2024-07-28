let video, canvas, ctx, detectedItemsList, model, purchaseItemsList, currentItem;
let purchaseItems = []; // Array to store detected items and their details
let isEditing = false; // Variable to track if the user is editing

function initializeApp() {
    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    detectedItemsList = document.getElementById('detectedItems');
    purchaseItemsList = document.getElementById('purchaseItemsList');
    loadModel();
    startCamera();
}

function loadModel() {
    const publishable_key = "rf_641cM6HVqqcEHzEYO7o9rvQdxBI3";
    const toLoad = {
        model: "groceries-items",
        version: 1
    };
    roboflow.auth({ publishable_key })
        .load(toLoad)
        .then(m => {
            model = m;
            document.body.classList.remove('loading');
            video.addEventListener('loadeddata', resizeCanvas);
            detectFrame();
        })
        .catch(error => {
            console.error('Error loading model:', error);
        });
}

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
            };
        })
        .catch(error => {
            console.error('Error accessing camera:', error);
        });
}

function resizeCanvas() {
    const { videoWidth, videoHeight } = video;
    canvas.width = videoWidth;
    canvas.height = videoHeight;
}

async function detectFrame() {
    if (!model || isEditing) return requestAnimationFrame(detectFrame);

    const predictions = await model.detect(video);
    renderPredictions(predictions);

    // Update purchase items list directly
    updatePurchaseItemsList(predictions);

    requestAnimationFrame(detectFrame);
}

function renderPredictions(predictions) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detectedItemsList.innerHTML = '';
    predictions.forEach(prediction => {
        const { class: itemClass, bbox, color } = prediction;
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.strokeRect(bbox[0], bbox[1], bbox[2], bbox[3]);

        const listItem = document.createElement('li');
        listItem.textContent = itemClass;
        detectedItemsList.appendChild(listItem);
    });
}

function updatePurchaseItemsList(predictions) {
    if (predictions.length === 0) return;

    // Reset purchase items list
    purchaseItemsList.innerHTML = '';

    // Create and add purchase items
    predictions.forEach(prediction => {
        const { class: itemClass } = prediction;

        // Check if the item already exists in purchase items
        const existingItemIndex = purchaseItems.findIndex(item => item.class === itemClass);

        if (existingItemIndex === -1) {
            // If the item doesn't exist, add it to purchase items
            purchaseItems.push({ class: itemClass, quantity: 0, bestBefore: "" });
        }
    });

    // Update the purchase system UI
    updatePurchaseSystemUI();
}

function updatePurchaseSystemUI() {
    // Clear the purchase items list before re-rendering
    purchaseItemsList.innerHTML = '';

    // Iterate over the purchase items and update the UI
    purchaseItems.forEach(item => {
        const itemEntry = document.createElement('div');
        itemEntry.textContent = item.class;

        // Quantity input
        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.placeholder = 'Quantity';
        quantityInput.value = item.quantity;
        quantityInput.addEventListener('input', () => {
            item.quantity = parseInt(quantityInput.value);
        });

        // Best before date input
        const bestBeforeInput = document.createElement('input');
        bestBeforeInput.type = 'date';
        bestBeforeInput.placeholder = 'Best Before';
        bestBeforeInput.value = item.bestBefore;
        bestBeforeInput.addEventListener('input', () => {
            item.bestBefore = bestBeforeInput.value;
        });
        

        


        itemEntry.appendChild(quantityInput);
        itemEntry.appendChild(bestBeforeInput);
        
        

        purchaseItemsList.appendChild(itemEntry);
    });
}
function saveToInventory() {
    // Retrieve existing inventory from localStorage
    const existingInventory = JSON.parse(localStorage.getItem('inventory')) || [];

    // Update existing inventory with purchased items
    purchaseItems.forEach(purchasedItem => {
        const existingItemIndex = existingInventory.findIndex(item => item.class === purchasedItem.class);
        if (existingItemIndex === -1) {
            // Add new item to inventory
            existingInventory.push(purchasedItem);
        } else {
            // Update existing item's quantity and best before date
            existingInventory[existingItemIndex].quantity += purchasedItem.quantity;
            existingInventory[existingItemIndex].bestBefore = purchasedItem.bestBefore;
        }
    });

    // Save updated inventory to localStorage
    localStorage.setItem('inventory', JSON.stringify(existingInventory));

    // Clear purchase items
    purchaseItems = [];
    updatePurchaseSystemUI();
}


function clearPurchases() {
    console.log("Clearing purchases...");
    purchaseItems = [];
    updatePurchaseSystemUI();
}

document.addEventListener('DOMContentLoaded', initializeApp);
