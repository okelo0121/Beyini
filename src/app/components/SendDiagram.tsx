import React from 'react';
import { User, Wallet, Plus } from 'lucide-react';

export const SendDiagram: React.FC = () => {
  return (
    <div className="by-diagram-container">
      {/* Node 1: Sender */}
      <div className="by-diagram-node">
        <div className="by-diagram-circle">
          <User size={30} strokeWidth={1.8} color="#111111" />
        </div>
        <span className="by-diagram-caption">You send to a person</span>
      </div>

      {/* Connector with Orange + node */}
      <div className="by-diagram-connector">
        <div className="by-diagram-dashed-line" />
        <div className="by-diagram-plus-node">
          <Plus size={13} strokeWidth={3} />
        </div>
      </div>

      {/* Node 2: Recipient */}
      <div className="by-diagram-node">
        <div className="by-diagram-circle">
          <Wallet size={28} strokeWidth={1.8} color="#111111" />
        </div>
        <span className="by-diagram-caption">They choose how to receive</span>
      </div>
    </div>
  );
};
