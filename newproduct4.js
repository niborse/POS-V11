const db = firebase.firestore();
const storage = firebase.storage();

const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const dropZone = document.getElementById('dropZone');
    const imagePreview = document.getElementById('imagePreview');
    const toStep2 = document.getElementById('toStep2');
    const toStep3 = document.getElementById('toStep3');
    const backToStep1 = document.getElementById('backToStep1');
    const backToStep2 = document.getElementById('backToStep2');
    const submitRequest = document.getElementById('submitRequest');
    const successModal = document.getElementById('successModal');
    const modalClose = document.getElementById('modalClose');
    
    // Step elements - ADD THESE
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const step1Content = document.getElementById('step1-content'); // This was missing
    const step2Content = document.getElementById('step2-content'); // This was missing
    const step3Content = document.getElementById('step3-content'); // This was missing
    
    const taggingPreview = document.getElementById('taggingPreview');
    const prevImageBtn = document.getElementById('prevImage');
    const nextImageBtn = document.getElementById('nextImage');
    const imageCounter = document.getElementById('imageCounter');
    const saveTagsBtn = document.getElementById('saveTags');
    const productName = document.getElementById('productName');
    const productDescription = document.getElementById('productDescription');
    const productTags = document.getElementById('productTags');
    const imageComment = document.getElementById('imageComment');
    const submissionSummary = document.getElementById('submissionSummary');
    const contactName = document.getElementById('contactName');
    const contactEmail = document.getElementById('contactEmail');
    const additionalNotes = document.getElementById('additionalNotes');
    // State variables
    let uploadedFiles = [];
    let currentImageIndex = 0;
    let taggedImages = [];

    // Initialize drop zone
    function initDropZone() {
        dropZone.addEventListener('click', () => fileInput.click());
        browseBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', handleFileSelect);

        // Drag and drop handlers
        ['dragover', 'dragleave', 'drop'].forEach(event => {
            dropZone.addEventListener(event, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropZone.classList.toggle('dragover', event === 'dragover');

                if (event === 'drop' && e.dataTransfer.files.length) {
                    fileInput.files = e.dataTransfer.files;
                    handleFileSelect({ target: fileInput });
                }
            });
        });
    }

    // Handle file selection
    function handleFileSelect(e) {
        const files = Array.from(e.target.files).filter(file => {
            if (!file.type.startsWith('image/')) {
                alert(`${file.name} is not an image file`);
                return false;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert(`${file.name} is too large (max 5MB)`);
                return false;
            }
            return true;
        });

        uploadedFiles = [...uploadedFiles, ...files];
        displayImagePreviews();
        toStep2.disabled = uploadedFiles.length === 0;
    }

    // Display image previews
    function displayImagePreviews() {
        imagePreview.innerHTML = '';
        uploadedFiles.forEach((file, index) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';

            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeImage(index);
            });

            previewItem.append(img, removeBtn);
            imagePreview.appendChild(previewItem);
        });
    }

    function removeImage(index) {
        URL.revokeObjectURL(uploadedFiles[index].previewUrl);
        uploadedFiles.splice(index, 1);
        displayImagePreviews();
        toStep2.disabled = uploadedFiles.length === 0;
    }

    // Show tagging image in the preview box
    function showTaggingImage(index) {
        if (taggedImages.length === 0) return;
        
        const imageData = taggedImages[index];
        taggingPreview.innerHTML = '';
        
        const img = document.createElement('img');
        img.src = imageData.previewUrl;
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        taggingPreview.appendChild(img);
      
        // Populate form fields
        productName.value = imageData.name || '';
        productDescription.value = imageData.description || '';
        productTags.value = imageData.tags.join(', ') || '';
        imageComment.value = imageData.comment || '';
        
        // Update navigation
        imageCounter.textContent = `${index + 1} of ${taggedImages.length}`;
        prevImageBtn.disabled = index === 0;
        nextImageBtn.disabled = index === taggedImages.length - 1;
    }

    // Initialize navigation
    function initNavigation() {
        // Step 1 to Step 2
        toStep2.addEventListener('click', () => {
            taggedImages = uploadedFiles.map(file => ({
                file,
                name: '',
                description: '',
                tags: [],
                comment: '',
                previewUrl: URL.createObjectURL(file)
            }));
            
            currentImageIndex = 0;
            showTaggingImage(currentImageIndex);
            
            step1.classList.remove('active');
            step2.classList.add('active');
            step1Content.classList.remove('active');
            step2Content.classList.add('active');
        });
        
        // Step 2 to Step 3
        toStep3.addEventListener('click', () => {
            if (taggedImages.some(img => !img.name.trim())) {
                alert('Please provide at least a product name for all images.');
                return;
            }
            
            prepareSubmissionSummary();
            
            step2.classList.remove('active');
            step3.classList.add('active');
            step2Content.classList.remove('active');
            step3Content.classList.add('active');
        });
        
        // Navigation buttons
        prevImageBtn.addEventListener('click', () => {
            if (currentImageIndex > 0) {
                saveCurrentTags();
                currentImageIndex--;
                showTaggingImage(currentImageIndex);
            }
        });

        nextImageBtn.addEventListener('click', () => {
            if (currentImageIndex < taggedImages.length - 1) {
                saveCurrentTags();
                currentImageIndex++;
                showTaggingImage(currentImageIndex);
            }
        });
        
        // Back buttons
        backToStep1.addEventListener('click', () => navigateToStep(1));
        backToStep2.addEventListener('click', () => navigateToStep(2));
        
        // Reset form after submission
        modalClose.addEventListener('click', resetForm);
    }

    function saveCurrentTags() {
        if (taggedImages.length === 0) return;

        const currentImage = taggedImages[currentImageIndex];
        
        // Save all fields
        currentImage.name = productName.value.trim();
        currentImage.description = productDescription.value.trim();
        currentImage.tags = productTags.value.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
        currentImage.comment = imageComment.value.trim();
        
        // Show visual feedback
        const feedback = document.createElement('div');
        feedback.className = 'save-feedback';
        feedback.textContent = 'Tags saved!';
        document.querySelector('.tagging-form').appendChild(feedback);
        
        // Remove feedback after 2 seconds
        setTimeout(() => {
            feedback.remove();
        }, 2000);
    }

    // Initialize save button
    saveTagsBtn.addEventListener('click', saveCurrentTags);

    function prepareSubmissionSummary() {
        submissionSummary.innerHTML = '';
        const productsMap = new Map();

        taggedImages.forEach(image => {
            if (!productsMap.has(image.name)) {
                productsMap.set(image.name, {
                    name: image.name,
                    description: image.description,
                    tags: [...new Set(image.tags)],
                    images: []
                });
            }
            productsMap.get(image.name).images.push({
                previewUrl: image.previewUrl,
                comment: image.comment
            });
        });

        productsMap.forEach((product, name) => {
            const summaryItem = document.createElement('div');
            summaryItem.className = 'summary-item';

            const img = document.createElement('img');
            img.src = product.images[0].previewUrl;
            img.style.width = '100%';
            img.style.height = '120px';
            img.style.objectFit = 'cover';

            const title = document.createElement('h4');
            title.textContent = name;

            const desc = document.createElement('p');
            desc.textContent = product.description || 'No description';

            const tags = document.createElement('p');
            tags.textContent = `Tags: ${product.tags.join(', ')}`;

            const imageCount = document.createElement('p');
            imageCount.textContent = `Images: ${product.images.length}`;

            summaryItem.append(img, title, desc, tags, imageCount);
            submissionSummary.appendChild(summaryItem);
        });
    }

    function navigateToStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.step, .step-content').forEach(el => {
            el.classList.remove('active');
        });
        
        // Show selected step
        document.getElementById(`step${stepNumber}`).classList.add('active');
        document.getElementById(`step${stepNumber}-content`).classList.add('active');
    }

    function resetForm() {
        successModal.style.display = 'none';
        
        // Clear all data
        taggedImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
        uploadedFiles = [];
        taggedImages = [];
        currentImageIndex = 0;

        // Return to step 1
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        document.querySelectorAll('.step-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById('step1').classList.add('active');
        document.getElementById('step1-content').classList.add('active');

        // Clear all form fields
        document.querySelectorAll('input, textarea').forEach(field => {
            field.value = '';
        });

        // Clear image preview
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('toStep2').disabled = true;
    }

    async function uploadToFirebase(data, files) {
        const imageUrls = [];
        
        for (const file of files) {
            try {
                // Show upload progress
                document.getElementById('currentFile').textContent = file.name;
                
                // Create a unique filename
                const timestamp = Date.now();
                const safeName = file.name.replace(/[^\w.-]/g, '_');
                const filePath = `products/${timestamp}_${safeName}`;
                const storageRef = storage.ref(filePath);
                
                // Create metadata with content type
                const metadata = {
                    contentType: file.type,
                    customMetadata: {
                        submittedBy: data.contactEmail,
                        productName: data.name
                    }
                };

                // Upload with proper metadata
                const uploadTask = storageRef.put(file, metadata);
                
                // Track upload progress
                await new Promise((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            document.getElementById('uploadProgressBar').value = progress;
                            document.getElementById('uploadStatus').textContent = 
                                `${Math.round(progress)}% - ${file.name}`;
                        },
                        (error) => {
                            console.error('Upload error:', error);
                            reject(error);
                        },
                        () => resolve()
                    );
                });
                
                // Get download URL
                const downloadURL = await storageRef.getDownloadURL();
                imageUrls.push(downloadURL);
                
            } catch (error) {
                console.error('Error uploading image:', error);
                throw new Error(`Failed to upload ${file.name}: ${error.message}`);
            }
        }
        
        // Save product data to Firestore
        try {
            const productDoc = {
                name: data.name,
                description: data.description,
                tags: data.tags,
                images: imageUrls,
                contactName: data.contactName,
                contactEmail: data.contactEmail,
                additionalNotes: data.additionalNotes,
                submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'pending'
            };
            
            await db.collection('products').add(productDoc);
            return { success: true };
            
        } catch (error) {
            console.error('Error saving to Firestore:', error);
            throw new Error('Failed to save product data');
        }
    }

    submitRequest.addEventListener('click', async () => {
        // Validate contact info
        if (!contactName.value.trim()) {
            alert('Please enter your name');
            return;
        }
        
        if (!contactEmail.value.trim() || !contactEmail.value.includes('@')) {
            alert('Please enter a valid email');
            return;
        }
        
        try {
            submitRequest.disabled = true;
            submitRequest.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            
            // Show upload progress UI
            document.getElementById('uploadProgress').style.display = 'block';
            
            // Prepare submission data
            const submissionData = {
                name: taggedImages[0].name,
                description: taggedImages[0].description,
                tags: [...new Set(taggedImages.flatMap(img => img.tags))],
                contactName: contactName.value.trim(),
                contactEmail: contactEmail.value.trim(),
                additionalNotes: additionalNotes.value.trim()
            };
            
            // Upload to Firebase
            await uploadToFirebase(submissionData, uploadedFiles);
            
            // Show success
            successModal.style.display = 'flex';
            
        } catch (error) {
            console.error("Submission failed:", error);
            alert("Upload failed: " + error.message);
        } finally {
            submitRequest.disabled = false;
            submitRequest.innerHTML = 'Submit Request';
        }
    });

    // Initialize the app
    initDropZone();
    initNavigation();
});