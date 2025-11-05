async function verifyPerson(frontImage, sideImage, backImage) {
    try {
        const response = await fetch('/api/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                frontImage,
                sideImage,
                backImage
            })
        });

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message);
        }

        return result.is_same_person;
    } catch (error) {
        console.error('Person verification failed:', error);
        throw error;
    }
}

// Add this to your existing upload handler
async function handleImageUpload(files) {
    try {
        // First verify it's the same person in all images
        const verificationResult = await verifyPerson(
            files.frontImage.path,
            files.sideImage.path,
            files.backImage.path
        );

        if (!verificationResult) {
            alert("Please ensure all photos are of the same person and only one person is in each photo.");
            return false;
        }

        // If verification passed, proceed with your existing upload logic
        return true;
    } catch (error) {
        alert("Error during person verification: " + error.message);
        return false;
    }
}