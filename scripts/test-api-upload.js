const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
    const form = new FormData();
    // Create a dummy image file
    fs.writeFileSync('dummy.jpg', 'fake image data');
    form.append('file', fs.createReadStream('dummy.jpg'));

    try {
        const res = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            // DO NOT pass Content-Type header with fetch when using FormData in Node,
            // as it needs the boundary, or use the object directly
            body: form,
            // Mock session? We might get 401 Unauthorized if we don't mock it.
        });

        const text = await res.text();
        console.log("Status:", res.status);
        console.log("Response:", text);
    } catch (e) {
        console.error(e);
    } finally {
        fs.unlinkSync('dummy.jpg');
    }
}

testUpload();
