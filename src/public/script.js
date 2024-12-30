// src/public/script.js
let allSuppliers = [];

async function fetchSuppliers() {
    try {
        const response = await fetch('/api/suppliers');
        const data = await response.json();
        console.log('Geladene Daten:', data); // Debug-Log
        
        if (!data || !data.suppliers) {
            throw new Error('Keine Lieferanten-Daten empfangen');
        }

        allSuppliers = data.suppliers;
        console.log('Verarbeitete Lieferanten:', allSuppliers); // Debug-Log
        
        updateSupplierFilter(allSuppliers);
        filterSuppliers();
    } catch (error) {
        console.error('Error fetching suppliers:', error);
    }
}

function filterSuppliers() {
    const marketType = document.getElementById('marketType').value;
    const energyType = document.getElementById('energyType').value;
    const selectedSupplier = document.getElementById('supplier').value;

    console.log('Filter-Werte:', { marketType, energyType, selectedSupplier }); // Debug-Log

    const filteredSuppliers = allSuppliers.filter(supplier => {
        const matchSupplier = selectedSupplier === 'all' || 
                             supplier.id === parseInt(selectedSupplier);

        const matchEnergy = energyType === 'all' || 
                          (supplier.energy_types && 
                           supplier.energy_types.includes(energyType));

        return matchSupplier && matchEnergy;
    });

    console.log('Gefilterte Lieferanten:', filteredSuppliers); // Debug-Log
    displaySuppliers(filteredSuppliers);
}

function displaySuppliers(suppliers) {
    const container = document.getElementById('suppliers-container');
    if (!container) {
        console.error('Container nicht gefunden!');
        return;
    }
    
    container.innerHTML = '';
    
    if (suppliers.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <p>Keine Lieferanten gefunden für die ausgewählten Filter.</p>
            </div>
        `;
        return;
    }
    
    suppliers.forEach(supplier => {
        const card = createSupplierCard(supplier);
        container.appendChild(card);
    });
}

function createSupplierCard(supplier) {
    console.log('Erstelle Karte für:', supplier); // Debug-Log
    
    const card = document.createElement('div');
    card.className = 'supplier-card';
    
    card.innerHTML = `
        <div class="supplier-header">
            <h3 class="supplier-name">${supplier.name}</h3>
            ${supplier.market_type ? `<span class="supplier-type">${supplier.market_type}</span>` : ''}
        </div>
        <div class="supplier-details">
            <div class="detail-item">
                <span class="detail-label">Energietypen:</span>
                <div class="tag-container">
                    ${supplier.energy_types && supplier.energy_types.length > 0 
                        ? supplier.energy_types.map(type => 
                            `<span class="tag">${type}</span>`
                          ).join('') 
                        : '<span class="no-data">Keine Energietypen</span>'}
                </div>
            </div>
            <div class="detail-item">
                <span class="detail-label">Messtypen:</span>
                <div class="tag-container">
                    ${supplier.measurement_types && supplier.measurement_types.length > 0
                        ? supplier.measurement_types.map(type => 
                            `<span class="tag">${type}</span>`
                          ).join('')
                        : '<span class="no-data">Keine Messtypen</span>'}
                </div>
            </div>
        </div>
    `;
    
    return card;
}

function updateSupplierFilter(suppliers) {
    const select = document.getElementById('supplier');
    if (!select) return;
    
    select.innerHTML = '<option value="all">Alle Lieferanten</option>';
    suppliers.forEach(supplier => {
        select.innerHTML += `<option value="${supplier.id}">${supplier.name}</option>`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchSuppliers();
    
    const marketTypeSelect = document.getElementById('marketType');
    const energyTypeSelect = document.getElementById('energyType');
    const supplierSelect = document.getElementById('supplier');
    
    if (marketTypeSelect) marketTypeSelect.addEventListener('change', filterSuppliers);
    if (energyTypeSelect) energyTypeSelect.addEventListener('change', filterSuppliers);
    if (supplierSelect) supplierSelect.addEventListener('change', filterSuppliers);
});