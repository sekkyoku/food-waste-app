// Function to upload image and metadata to Azure
async function uploadToAzure(imageData, metadata) {
    // Remove the data URL prefix to get just the base64 data
    const base64Data = imageData.split(',')[1];
    
    // Generate a unique filename
    const filename = `${metadata.dishName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.jpg`;
    
    // Azure Storage SAS parameters
    const storageAccount = "foodwastestorageacc";
    const sasToken = "?sv=2024-11-04&ss=b&srt=co&sp=rwlactfx&se=2025-05-14T01:55:38Z&st=2025-04-13T17:55:38Z&spr=https&sig=gf%2FVNKz9ktIWIx04vI%2Fdq3CzYIsz8kvNvK%2FdUNaPNao%3D";
    
    try {
        // Convert base64 to blob
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        
        const blob = new Blob(byteArrays, { type: 'image/jpeg' });
        
        // Upload image to Azure Blob Storage
        const imageUrl = `https://${storageAccount}.blob.core.windows.net/raw-images/${filename}${sasToken}`;
        await fetch(imageUrl, {
            method: 'PUT',
            headers: {
                'x-ms-blob-type': 'BlockBlob',
                'Content-Type': 'image/jpeg'
            },
            body: blob
        });
        
        // Create metadata JSON file
        const metadataFilename = `${filename.replace('.jpg', '-metadata.json')}`;
        const metadataUrl = `https://${storageAccount}.blob.core.windows.net/raw-images/${metadataFilename}${sasToken}`;
        
        await fetch(metadataUrl, {
            method: 'PUT',
            headers: {
                'x-ms-blob-type': 'BlockBlob',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        });
        
        return { imageUrl, metadataUrl };
    } catch (error) {
        console.error('Error uploading to Azure:', error);
        throw error;
    }
}