document.getElementById('productForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = {
        class: document.getElementById('class').value,
        name: document.getElementById('name').value,
        price: document.getElementById('price').value,
        barcode: document.getElementById('barcode').value,
        margin: document.getElementById('margin').value,
        profit: document.getElementById('profit').value
    };

    fetch('http://192.168.0.103:3001/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        alert('Product added successfully!');
        document.getElementById('productForm').reset(); // Reset form after successful submission
    })
    .catch(error => {
        console.error('Error:', error);
        alert('There was an error adding the product: ' + error.message);
    });
});



