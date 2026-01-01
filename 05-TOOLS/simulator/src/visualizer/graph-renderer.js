/**
 * Graph Renderer - D3.js based network visualization
 */

class GraphRenderer {
  constructor(containerId) {
    this.container = d3.select(containerId);
    this.svg = null;
    this.simulation = null;
    this.nodes = [];
    this.links = [];
    this.selectedNode = null;
  }

  /**
   * Render the network topology
   */
  render(topology) {
    this.clear();

    // Build node and link data
    this.nodes = [];
    this.links = [];

    // Fruiting bodies as nodes
    if (topology.fruitingBodies) {
      for (let fb of topology.fruitingBodies) {
        this.nodes.push({
          id: fb,
          type: 'fruiting_body',
          label: fb,
          category: this.categorizeFruitingBody(fb),
        });
      }
    }

    // Spawned hyphae as nodes
    if (topology.spawns) {
      for (let spawn of topology.spawns) {
        this.nodes.push({
          id: spawn.instanceId,
          type: 'hyphal',
          label: spawn.instanceId,
          hyphalType: spawn.hyphalType,
        });
      }
    }

    // Sockets as links
    if (topology.sockets) {
      for (let socket of topology.sockets) {
        this.links.push({
          source: socket.from,
          target: socket.to,
          frequency: socket.frequency,
          broadcast: socket.to === '*',
        });
      }
    }

    // Create SVG
    const width = this.container.node().clientWidth;
    const height = this.container.node().clientHeight;

    this.svg = this.container.append('svg')
      .attr('width', width)
      .attr('height', height);

    // Add definitions for arrow markers
    this.svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('refX', 15)
      .attr('refY', 3)
      .attr('orient', 'auto')
      .append('polygon')
      .attr('points', '0 0, 10 3, 0 6')
      .attr('fill', '#bdc3c7');

    // Create force simulation
    this.simulation = d3.forceSimulation(this.nodes)
      .force('link', d3.forceLink(this.links)
        .id(d => d.id)
        .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    // Render links (sockets)
    const links = this.svg.selectAll('.link')
      .data(this.links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('marker-end', 'url(#arrowhead)');

    // Link labels (frequencies)
    const linkLabels = this.svg.selectAll('.link-label')
      .data(this.links)
      .enter()
      .append('text')
      .attr('class', 'link-label')
      .text(d => d.frequency || '');

    // Render nodes (hyphae and fruiting bodies)
    const nodeGroups = this.svg.selectAll('.node')
      .data(this.nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .call(d3.drag()
        .on('start', (e, d) => this.dragStarted(e, d))
        .on('drag', (e, d) => this.dragged(e, d))
        .on('end', (e, d) => this.dragEnded(e, d))
      )
      .on('click', (e, d) => this.selectNode(d));

    // Draw node shapes
    nodeGroups.append('circle')
      .attr('class', d => {
        let classes = 'node ' + (d.type === 'fruiting_body' ? 'fruiting-body ' + d.category : 'hyphal');
        return classes;
      })
      .attr('r', d => d.type === 'fruiting_body' ? 12 : 15)
      .attr('id', d => 'node-' + d.id);

    // Draw node labels
    nodeGroups.append('text')
      .attr('class', 'node-label')
      .text(d => d.label)
      .attr('x', 0)
      .attr('y', 0);

    // Update positions on simulation tick
    this.simulation.on('tick', () => {
      links
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      linkLabels
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2);

      nodeGroups.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Add legend
    this.addLegend();

    // Add topology info
    this.addTopologyInfo();
  }

  /**
   * Categorize fruiting body
   */
  categorizeFruitingBody(name) {
    if (name.includes('input')) return 'input';
    if (name.includes('output')) return 'output';
    return 'other';
  }

  /**
   * Update visualization with runtime state
   */
  update(runtime) {
    if (!this.svg) return;

    // Update node colors based on agent state
    for (let agent of runtime.agents.values()) {
      const nodeElement = this.svg.select('#node-' + agent.id);

      if (nodeElement.node()) {
        nodeElement
          .attr('class', d => {
            let classes = 'node hyphal ' + agent.vitality;
            if (this.selectedNode?.id === agent.id) {
              classes += ' selected';
            }
            return classes;
          });
      }
    }

    // Animate signals through links (simplified)
    this.animateSignals(runtime);
  }

  /**
   * Animate signals flowing through network
   */
  animateSignals(runtime) {
    // This is a simplified animation
    // In a full implementation, we'd track individual signals
    for (let agent of runtime.agents.values()) {
      if (agent.outbox.length > 0) {
        // Highlight outgoing edges
        this.svg.selectAll('.link')
          .attr('class', d => {
            if (d.source.id === agent.id) {
              return 'link active';
            }
            return 'link inactive';
          });
      }
    }
  }

  /**
   * Handle node selection
   */
  selectNode(node) {
    this.selectedNode = node;

    // Update visualization
    this.svg.selectAll('.node')
      .attr('class', d => {
        let classes = 'node ' + (d.type === 'fruiting_body' ? 'fruiting-body' : 'hyphal');
        if (d.id === node.id) {
          classes += ' selected';
        }
        return classes;
      });

    // Update inspector panel
    this.updateInspector(node);
  }

  /**
   * Update state inspector panel
   */
  updateInspector(node) {
    const inspectorContent = document.getElementById('inspector-content');
    inspectorContent.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'inspector-section-title';
    title.textContent = `Agent: ${node.label}`;
    inspectorContent.appendChild(title);

    if (node.type === 'fruiting_body') {
      const info = document.createElement('div');
      info.textContent = `Type: Fruiting Body (${node.category})`;
      inspectorContent.appendChild(info);
    } else {
      const info = document.createElement('div');
      info.textContent = `Type: Hyphal (${node.hyphalType})`;
      inspectorContent.appendChild(info);
    }
  }

  /**
   * Drag handlers
   */
  dragStarted(event, d) {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  dragEnded(event, d) {
    if (!event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  /**
   * Add legend to visualization
   */
  addLegend() {
    const legend = this.svg.append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(10, 10)');

    const items = [
      { color: '#4a90e2', label: 'Hyphal Agent (Active)' },
      { color: '#95a5a6', label: 'Hyphal Agent (Idle)' },
      { color: '#f39c12', label: 'Hyphal Agent (Degraded)' },
      { color: '#3498db', label: 'Fruiting Body (Input)' },
      { color: '#9b59b6', label: 'Fruiting Body (Output)' },
    ];

    legend.selectAll('.legend-item')
      .data(items)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`)
      .append('circle')
      .attr('r', 6)
      .attr('fill', d => d.color);

    legend.selectAll('.legend-label')
      .data(items)
      .enter()
      .append('text')
      .attr('class', 'legend-label')
      .attr('x', 20)
      .attr('y', (d, i) => i * 20 + 4)
      .text(d => d.label);
  }

  /**
   * Add topology info panel
   */
  addTopologyInfo() {
    const info = this.svg.append('g')
      .attr('class', 'topology-info')
      .attr('transform', `translate(10, ${this.svg.attr('height') - 60})`);

    info.append('text')
      .attr('class', 'label')
      .attr('y', 0)
      .text('Topology:');

    info.append('text')
      .attr('y', 16)
      .text(`Agents: ${this.nodes.filter(n => n.type === 'hyphal').length}`);

    info.append('text')
      .attr('y', 32)
      .text(`Connections: ${this.links.length}`);
  }

  /**
   * Clear visualization
   */
  clear() {
    this.container.selectAll('*').remove();
    this.svg = null;
    this.simulation = null;
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GraphRenderer };
}
