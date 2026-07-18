/* Mermaid MicroSim Interactive Script
   Click a node to pin its details in the info panel.

   IMPORTANT: Define the nodeInfo object BEFORE loading this script:

   const nodeInfo = {
       'NodeId': {
           title: 'Node Title',
           description: 'HTML shown when the node is clicked'
       },
       ...
   };
*/

const infoDisplay = document.getElementById('info-display');
const defaultContent = '<p class="info-placeholder">Click a node to see details</p>';
let selectedNode = null;

function showNodeInfo(nodeId, el) {
    if (typeof nodeInfo !== 'undefined' && nodeInfo[nodeId]) {
        const info = nodeInfo[nodeId];
        infoDisplay.innerHTML = `
            <div class="info-title">${info.title}</div>
            <div class="info-content">${info.description}</div>
        `;
        if (selectedNode) selectedNode.classList.remove('node-selected');
        selectedNode = el;
        el.classList.add('node-selected');
    }
}

function clearSelection() {
    infoDisplay.innerHTML = defaultContent;
    if (selectedNode) {
        selectedNode.classList.remove('node-selected');
        selectedNode = null;
    }
}

/**
 * Extract the author-supplied node id from a Mermaid element id.
 * Mermaid v11 generates ids like "mermaid-1699-flowchart-NodeId-3"
 * (a per-render diagram prefix, then "flowchart-", the node id, and an index).
 */
function extractNodeId(el) {
    return el.id.replace(/^.*flowchart-/, '').replace(/-\d+$/, '');
}

function setupNodeInteractions() {
    const nodes = document.querySelectorAll('.node');
    nodes.forEach(node => {
        const nodeId = extractNodeId(node);
        if (typeof nodeInfo !== 'undefined' && nodeInfo[nodeId]) {
            node.addEventListener('click', (e) => {
                e.stopPropagation();
                showNodeInfo(nodeId, node);
            });
        }
    });
    // Clicking empty diagram space clears the selection
    const panel = document.querySelector('.diagram-panel');
    if (panel) panel.addEventListener('click', clearSelection);
}

/**
 * Wait for Mermaid to finish rendering before wiring interactions.
 */
function waitForMermaid() {
    const mermaidDiv = document.querySelector('.mermaid');
    const svg = mermaidDiv ? mermaidDiv.querySelector('svg') : null;
    const nodes = document.querySelectorAll('.node');

    if (svg && nodes.length > 0) {
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
