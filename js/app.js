// DOM Elements
const cameraView = document.getElementById('camera-view');
const cameraCanvas = document.getElementById('camera-canvas');
const cameraTrigger = document.getElementById('camera-trigger');
const capturedImage = document.getElementById('captured-image');
const metadataForm = document.getElementById('metadata-form');
const cameraContainer = document.querySelector('.camera-container');
const retakeButton = document.getElementById('retake-button');
const uploadStatus = document.getElementById('upload-status');
const statusMessage = document.getElementById('status-message');
const plateInfoForm = document.getElementById('plate-info');

// Global variables
let stream = null;

// Access the camera
async function initCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        });
        
        cameraView.srcObject = stream;
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Cannot access camera. Please ensure you have given camera permissions.');
    }
}

// Take a picture
function takePhoto() {
    const context = cameraCanvas.getContext('2d');
    const width = cameraView.videoWidth;
    const height = cameraView.videoHeight;
    
    if (width && height) {
        // Set canvas dimensions to match the video
        cameraCanvas.width = width;
        cameraCanvas.height = height;
        
        // Draw the video frame to the canvas
        context.drawImage(cameraView, 0, 0, width, height);
        
        // Convert canvas to image
        const imageData = cameraCanvas.toDataURL('image/jpeg', 0.8);
        capturedImage.src = imageData;
        
        // Show the metadata form, hide the camera
        cameraContainer.classList.add('hidden');
        metadataForm.classList.remove('hidden');
    } else {
        console.error('Video stream not available');
    }
}

// Retake photo
function retakePhoto() {
    // Show the camera, hide the metadata form
    cameraContainer.classList.remove('hidden');
    metadataForm.classList.add('hidden');
}

// Event listeners
document.addEventListener('DOMContentLoaded', initCamera);
cameraTrigger.addEventListener('click', takePhoto);
retakeButton.addEventListener('click', retakePhoto);

// Form submission
plateInfoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show upload status
    metadataForm.classList.add('hidden');
    uploadStatus.classList.remove('hidden');
    
    // Get form data
    const dishName = document.getElementById('dish-name').value;
    const portionSize = document.getElementById('portion-size').value;
    const mealTime = document.getElementById('meal-time').value;
    
    // Get the image data
    const imageData = capturedImage.src;
    
    // Create metadata object
    const metadata = {
        dishName,
        portionSize,
        mealTime,
        timestamp: new Date().toISOString()
    };
    
    try {
        // Upload image and metadata to Azure (function in azure-upload.js)
        await uploadToAzure(imageData, metadata);
        
        // Show success message
        statusMessage.textContent = 'Upload successful!';
        statusMessage.style.color = 'var(--success-color)';
        
        // Reset form after 2 seconds
        setTimeout(() => {
            uploadStatus.classList.add('hidden');
            cameraContainer.classList.remove('hidden');
            document.getElementById('dish-name').value = '';
        }, 2000);
        
    } catch (error) {
        console.error('Upload error:', error);
        statusMessage.textContent = 'Upload failed. Please try again.';
        statusMessage.style.color = 'var(--error-color)';
        
        // Show retry button
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Retry';
        retryButton.className = 'primary-button';
        retryButton.addEventListener('click', () => {
            uploadStatus.classList.add('hidden');
            metadataForm.classList.remove('hidden');
        });
        
        uploadStatus.appendChild(retryButton);
    }
});