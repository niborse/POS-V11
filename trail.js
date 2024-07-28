document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('item-form');
    const itemsList = document.getElementById('items-list');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const name = document.getElementById('name').value;
        const price = document.getElementById('price').value;
        const barcode = document.getElementById('barcode').value;

        const response = await fetch('http://localhost:5009/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, price, barcode })
        });

        const newItem = await response.json();
        displayItem(newItem);

        form.reset();
    });

    async function fetchItems() {
        const response = await fetch('http://localhost:5009/items');
        const items = await response.json();
        items.forEach(item => displayItem(item));
    }

    function displayItem(item) {
        const li = document.createElement('li');
        li.textContent = `Name: ${item.name}, Price: ${item.price}, Barcode: ${item.barcode}`;
        itemsList.appendChild(li);
    }

    fetchItems();
});
