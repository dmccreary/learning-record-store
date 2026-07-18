/* Learning Record to Action Workflow interactions.
   Click or keyboard selection keeps a description visible; hover provides previews. */
// CANVAS_HEIGHT: 700

const infoDisplay = document.getElementById('info-display');
const panelWrap = document.getElementById('panel-wrap');
const defaultContent = '<p class="info-placeholder">Hover over or select a workflow step to see details.</p>';
let selectedNodeId = null;

function showNodeInfo(nodeId) {
    const info = nodeInfo[nodeId];
    if (!info) return;

    infoDisplay.innerHTML = `
        <div class="info-title">${info.title}</div>
        <div class="info-content">${info.description}</div>
    `;
}

function positionPanel(event) {
    const wrapRect = panelWrap.getBoundingClientRect();
    const panelHeight = infoDisplay.offsetHeight || 120;
    const desiredTop = event.clientY - wrapRect.top - 30;
    const maximumTop = Math.max(8, panelWrap.offsetHeight - panelHeight - 8);
    infoDisplay.style.top = `${Math.max(8, Math.min(maximumTop, desiredTop))}px`;
}

function restoreSelectedOrDefault() {
    if (selectedNodeId) {
        showNodeInfo(selectedNodeId);
    } else {
        infoDisplay.innerHTML = defaultContent;
        infoDisplay.style.top = '8px';
    }
}

function selectNode(node, nodeId, event) {
    document.querySelectorAll('.node.selected').forEach((item) => item.classList.remove('selected'));
    selectedNodeId = nodeId;
    node.classList.add('selected');
    showNodeInfo(nodeId);
    positionPanel(event);
}

function setupNodeInteractions() {
    document.querySelectorAll('.node').forEach((node) => {
        // Mermaid 11 may prefix IDs with a generated diagram identifier, for example
        // "mermaid-123-flowchart-Activity-0". Read the declared node ID from the tail.
        const idMatch = node.id.match(/flowchart-([A-Za-z0-9_]+)-\d+$/);
        const nodeId = idMatch ? idMatch[1] : null;
        if (!nodeInfo[nodeId]) return;

        node.setAttribute('tabindex', '0');
        node.setAttribute('role', 'button');
        node.setAttribute('aria-label', `Show details for ${nodeInfo[nodeId].title}`);

        node.addEventListener('mouseenter', (event) => {
            showNodeInfo(nodeId);
            positionPanel(event);
        });
        node.addEventListener('mousemove', positionPanel);
        node.addEventListener('mouseleave', restoreSelectedOrDefault);
        node.addEventListener('click', (event) => selectNode(node, nodeId, event));
        node.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                const rect = node.getBoundingClientRect();
                selectNode(node, nodeId, {
                    clientY: rect.top + rect.height / 2
                });
            }
        });
    });
}

function waitForMermaid() {
    const svg = document.querySelector('.mermaid svg');
    if (svg && document.querySelectorAll('.node').length > 0) {
        setupNodeInteractions();
    } else {
        setTimeout(waitForMermaid, 100);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(waitForMermaid, 100));
} else {
    setTimeout(waitForMermaid, 100);
}
