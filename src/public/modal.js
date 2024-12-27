// Modal Funktionalität
async function openSupplierModal() {
    const modal = document.getElementById('supplierModal');
    modal.style.display = 'block';
}

async function saveSupplier(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('supplierName').value,
        market_type: document.getElementById('marketTypeSelect').value,
        energy_types: Array.from(document.querySelectorAll('input[name="energyType"]:checked')).map(cb => cb.value),
        measurement_types: Array.from(document.querySelectorAll('input[name="measurementType"]:checked')).map(cb => cb.value),
        category: document.getElementById('categorySelect').value
    };

    // Validierung
    if (!formData.name) {
        alert('Bitte geben Sie einen Namen ein');
        return;
    }
    if (!formData.market_type) {
        alert('Bitte wählen Sie einen Markttyp');
        return;
    }
    if (formData.energy_types.length === 0) {
        alert('Bitte wählen Sie mindestens einen Energietyp');
        return;
    }
    if (formData.measurement_types.length === 0) {
        alert('Bitte wählen Sie mindestens einen Messtyp');
        return;
    }
    if (!formData.category) {
        alert('Bitte wählen Sie eine Kategorie');
        return;
    }

    try {
        const response = await fetch('/api/suppliers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Fehler beim Speichern');

        const result = await response.json();
        
        // Modal schließen
        document.getElementById('supplierModal').style.display = 'none';
        
        // Formular zurücksetzen
        document.getElementById('supplierForm').reset();
        
        // Lieferantenliste aktualisieren
        await fetchSuppliers();
        
        // Erfolgsmeldung
        alert('Lieferant erfolgreich gespeichert!');
        
    } catch (error) {
        console.error('Error:', error);
        alert('Fehler beim Speichern des Lieferanten');
    }
}

// Event Listener
document.addEventListener('DOMContentLoaded', () => {
    const supplierForm = document.getElementById('supplierForm');
    if (supplierForm) {
        supplierForm.addEventListener('submit', saveSupplier);
    }
    
    // Schließen-Button
    const closeBtn = document.querySelector('#supplierModal .close');
    if (closeBtn) {
        closeBtn.onclick = function() {
            document.getElementById('supplierModal').style.display = 'none';
        }
    }
    
    // Außerhalb-Klick
    window.onclick = function(event) {
        const modal = document.getElementById('supplierModal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}); 