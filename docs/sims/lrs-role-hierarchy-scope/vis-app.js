/* vis-app.js — shared vis-network MicroSim driver.
   Each main.html defines window.GRAPH before loading this script:

   window.GRAPH = {
     nodes: [ {id, label, color, group, level?}, ... ],
     edges: [ {from, to, label?, dashes?}, ... ],
     nodeInfo: { id: {title, description}, ... },
     layout: 'physics' | 'hierarchical',   // default physics
     direction: 'UD' | 'LR',               // hierarchical only
   };
   Click a node -> its details render in the #info-display panel.
*/
(function () {
  const G = window.GRAPH || { nodes: [], edges: [], nodeInfo: {} };
  const container = document.getElementById('network');
  const nodes = new vis.DataSet(G.nodes);
  const edges = new vis.DataSet(G.edges);

  const options = {
    nodes: {
      shape: 'box',
      font: { size: 15, color: '#ffffff', face: 'Arial', multi: false },
      borderWidth: 2,
      margin: 9,
      widthConstraint: { maximum: 170 },
      shadow: { enabled: true, size: 4, x: 1, y: 1, color: 'rgba(0,0,0,0.15)' }
    },
    edges: {
      arrows: { to: { enabled: true, scaleFactor: 0.6 } },
      color: { color: '#9aa7b4', highlight: '#e63946' },
      font: { size: 12, color: '#3a3a3a', strokeWidth: 4, strokeColor: '#ffffff', align: 'middle' },
      smooth: { enabled: true, type: 'dynamic' }
    },
    physics: {
      enabled: true,
      stabilization: { enabled: true, iterations: 220 },
      barnesHut: { gravitationalConstant: -7500, springLength: 150, springConstant: 0.04, avoidOverlap: 0.4 }
    },
    interaction: { hover: true, tooltipDelay: 999999, navigationButtons: false, zoomView: true, dragView: true }
  };

  if (G.layout === 'hierarchical') {
    options.layout = {
      hierarchical: {
        enabled: true,
        direction: G.direction || 'UD',
        sortMethod: 'directed',
        levelSeparation: 110,
        nodeSpacing: 150,
        treeSpacing: 160
      }
    };
    options.physics = false;
  }

  const network = new vis.Network(container, { nodes: nodes, edges: edges }, options);
  window.__net = network; // exposed for test harness
  network.once('stabilizationIterationsDone', function () {
    network.setOptions({ physics: false });
    network.fit({ animation: false });
  });
  // Fit once more after a beat (covers hierarchical layouts that skip stabilization)
  setTimeout(function () { try { network.fit({ animation: false }); } catch (e) {} }, 400);

  const infoDisplay = document.getElementById('info-display');
  const def = '<p class="info-placeholder">Click a node to see details</p>';
  network.on('click', function (params) {
    if (params.nodes && params.nodes.length) {
      const info = (G.nodeInfo || {})[params.nodes[0]];
      if (info) {
        infoDisplay.innerHTML =
          '<div class="info-title">' + info.title + '</div>' +
          '<div class="info-content">' + info.description + '</div>';
        return;
      }
    }
    infoDisplay.innerHTML = def;
  });
})();
