// Fetch and render the feature matrix
fetch('features.json')
    .then(response => response.json())
    .then(data => {
        const tableBody = document.getElementById('table-body');

        // Define the fixed order of IDEs to match table header
        const idesOrder = ['VSCode', 'Visual Studio', 'JetBrains', 'Xcode', 'Vim/Neovim', 'Eclipse'];

        // Function to determine the highest support level and corresponding CSS class
        function getSupportLevel(ideData) {
            if (!ideData || (!ideData.ga && !ideData.preview && !ideData.private_preview)) {
                return { class: 'na', version: '', tooltip: 'Not supported.', url: '' };
            }
            // Define stage precedence: ga > preview > private_preview
            const stagePrecedence = { 'ga': 3, 'preview': 2, 'private_preview': 1 };
            // Collect available stages
            const stages = ['ga', 'preview', 'private_preview'].filter(stage => ideData[stage]);
            // Find highest stage
            const highestStage = stages.reduce((highest, stage) => {
                return (!highest || stagePrecedence[stage] > stagePrecedence[highest]) ? stage : highest;
            }, stages[0]);
            const stageData = ideData[highestStage] || {};
            // Map stage to CSS class
            const classMap = {
                'ga': 'supported',
                'preview': 'preview',
                'private_preview': 'private_preview'
            };
            // Generate tooltip with all stages
            const tooltip = stages.length > 0
                ? `<ul>${stages.map(stage => {
                    const s = ideData[stage];
                    return `<li><strong>${stage.replace('_', ' ').toUpperCase()}</strong>: ${s.version} (${new Date(s.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})</li>`;
                }).join('')}</ul>`
                : 'Not supported.';
            return {
                class: classMap[highestStage] || 'na',
                version: stageData.version || '',
                url: stageData.url || '',
                tooltip
            };
        }

        // Sort features by earliest date (descending, newest first)
        data.sort((a, b) => {
            // Get all dates for each feature
            const aDates = Object.values(a.ides)
                .flatMap(ide => ['ga', 'preview', 'private_preview']
                    .filter(stage => ide[stage])
                    .map(stage => ide[stage].date))
                .filter(date => date);
            const bDates = Object.values(b.ides)
                .flatMap(ide => ['ga', 'preview', 'private_preview']
                    .filter(stage => ide[stage])
                    .map(stage => ide[stage].date))
                .filter(date => date);
            // Find the earliest date for each feature
            const aEarliest = aDates.length > 0 ? Math.min(...aDates.map(d => new Date(d).getTime())) : Infinity;
            const bEarliest = bDates.length > 0 ? Math.min(...bDates.map(d => new Date(d).getTime())) : Infinity;
            // Sort descending (newest first); if no dates, push to end
            return bEarliest - aEarliest;
        });

        // Generate table rows
        data.forEach(feature => {
            const row = document.createElement('tr');

            // Feature name
            const featureCell = document.createElement('td');
            featureCell.textContent = feature.feature;
            featureCell.className = 'border p-2 font-medium';
            row.appendChild(featureCell);

            // IDE cells in fixed order
            idesOrder.forEach(ide => {
                const cell = document.createElement('td');
                const ideData = feature.ides[ide] || {};
                const supportInfo = getSupportLevel(ideData);

                cell.className = `border p-2 ${supportInfo.class}`;
                cell.textContent = supportInfo.version;

                // Make cell clickable if URL exists
                if (supportInfo.url && supportInfo.class !== 'na') {
                    cell.classList.add('clickable');
                    cell.onclick = () => window.open(supportInfo.url, '_blank');
                }

                cell.dataset.tippyContent = supportInfo.tooltip;
                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });

        // Initialize Tippy.js tooltips
        tippy('[data-tippy-content]', {
            allowHTML: true,
            theme: 'light-border',
        });
    })
    .catch(error => console.error('Error loading features:', error));
    
function downloadJSON() {
    fetch('features.json')
        .then(response => response.json())
        .then(data => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'features.json';
            a.click();
            URL.revokeObjectURL(url);
        });
}