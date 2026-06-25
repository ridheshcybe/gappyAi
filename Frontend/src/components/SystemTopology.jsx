// frontend/src/components/SystemTopology.jsx
import { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import api from '../lib/api';
import './SystemTopology.css';

// Custom Node Renderer
const ServiceNode = ({ data }) => {
  const nodeClass = `topo-node topo-${data.type} ${data.hasIncident ? 'incident-active' : ''}`;

  return (
    <div className={nodeClass} title={data.label}>
      <Handle type="target" position={Position.Top} />
      <div className="topo-icon">{data.icon}</div>
      <div className="topo-label">{data.label}</div>
      {data.hasIncident && (
        <div className={`sev-dot sev-${data.highestSeverity?.toLowerCase()}`}></div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes = {
  service: ServiceNode
};

const TYPE_ICONS = {
  edge: '🌍',
  gateway: '🚪',
  service: '⚙️',
  database: '🗄️',
  cache: '⚡'
};

export default function SystemTopology() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTopology = useCallback(async () => {
    try {
      const res = await api.getTopology();

      const mappedNodes = res.topology.nodes.map(node => {
        const hasIncident = res.impactedServices.includes(node.id);
        const incidents = res.incidentMap[node.id] || [];

        // Find highest severity for this node
        const sevOrder = ['P0', 'P1', 'P2', 'P3'];
        const highestSeverity = incidents.sort((a, b) =>
          sevOrder.indexOf(a.severity) - sevOrder.indexOf(b.severity)
        )[0]?.severity;

        return {
          id: node.id,
          type: 'service',
          position: { x: 0, y: 0 }, // React flow auto-layouts via dagre usually,
                                     // but for hackathon we hardcode basic layout below
          data: {
            ...node,
            icon: TYPE_ICONS[node.type] || '📦',
            hasIncident,
            highestSeverity
          }
        };
      });

      // Simple manual layout for hackathon (without adding dagre dependency)
      const positions = {
        'cdn': { x: 400, y: 0 },
        'gateway': { x: 400, y: 100 },
        'auth': { x: 150, y: 250 },
        'payments': { x: 400, y: 250 },
        'orders': { x: 650, y: 250 },
        'db-postgres': { x: 275, y: 400 },
        'redis': { x: 525, y: 400 }
      };

      const positionedNodes = mappedNodes.map(n => ({
        ...n,
        position: positions[n.id] || { x: 0, y: 0 }
      }));

      setNodes(positionedNodes);
      setEdges(res.topology.edges.map(e => ({ ...e, animated: true })));
      setLoading(false);
    } catch (err) {
      console.error('Topology fetch failed', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopology();
    const id = setInterval(fetchTopology, 10000); // refresh every 10s
    return () => clearInterval(id);
  }, [fetchTopology]);

  if (loading) return <div className="loading">Loading Topology...</div>;

  return (
    <div className="topology-container" style={{ height: '500px', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        panOnScroll
        zoomOnScroll={false}
        nodesDraggable={false}
      >
        <Background color="#1e293b" gap={16} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={n => n.data.hasIncident ? '#ef4444' : '#3b82f6'}
          maskColor="rgba(10, 15, 24, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}