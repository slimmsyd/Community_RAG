import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { FamilyTreeProps } from '@/types/user';
import { SimulationNodeDatum } from 'd3';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface TreeNode extends SimulationNodeDatum {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
  profileImage?: string;
  familyRole?: string;
  gender?: string;
  occupation?: string;
  location?: string;
  birthday?: string;
  relationships: Array<{
    relatedUserId: string;
    relationship: string;
    confirmed: boolean;
  }>;
  userDetails?: {
    id: string;
    name: string;
    email: string;
    walletAddress?: string;
    profileImage: string;
    familyRole: string;
    gender: string;
    occupation: string;
    location: string;
    birthDay: string;
    maritalStatus: string;
    bio: string;
    phoneNumber: string;
    discordTag?: string;
  };
}

interface TreeLink extends d3.SimulationLinkDatum<TreeNode> {
  type: string;
  confirmed?: boolean;
}

interface PopupState {
  nodeId: string;
  x: number;
  y: number;
}

interface SelectedNodeInfo {
  node: TreeNode;
  x: number;
  y: number;
}

interface HoverState {
  nodeId: string;
  x: number;
  y: number;
  timer?: NodeJS.Timeout;
}

export function FamilyTree({ currentPage, onNodeClick, className, userProfileImage }: FamilyTreeProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [activePopup, setActivePopup] = useState<PopupState | null>(null);
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [links, setLinks] = useState<TreeLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<SelectedNodeInfo | null>(null);
  const [hoveredNode, setHoveredNode] = useState<HoverState | null>(null);
  const [isMenuFading, setIsMenuFading] = useState(false);

  // Update the data fetching useEffect
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        setIsLoading(true);

        // Get current user first
        const email = session?.user?.email;
        const walletAddress = session?.user?.walletAddress;

        if (!email && !walletAddress) {
          console.log("No authentication credentials found");
          return;
        }

        // Fetch all users
        const allUsersResponse = await fetch('/api/users/all');
        const allUsersData = await allUsersResponse.json();
        console.log('All users response:', allUsersData);

        if (!allUsersData.success) {
          console.error('Failed to fetch all users:', allUsersData.error);
          return;
        }

        // Create nodes from all users
        console.log('Creating nodes from users. User count:', allUsersData.users.length);
        const treeNodes: TreeNode[] = allUsersData.users.map((user: any) => ({
          id: user._id,
          name: user.name || 'Unknown User',
          email: user.email,
          walletAddress: user.walletAddress,
          profileImage: user.profileImage,
          familyRole: user.familyRole || 'Member',
          gender: user.gender,
          occupation: user.occupation,
          location: user.location,
          birthday: user.birthDay,
          relationships: user.familyConnections || [],
          x: 0,
          y: 0
        }));

        // Set current user ID
        const currentUser = treeNodes.find(node => 
          (email && node.email === email) || 
          (walletAddress && node.walletAddress === walletAddress)
        );
        if (currentUser) {
          setCurrentUserId(currentUser.id);
        }

        // Create links between all users (simple network)
        const treeLinks: TreeLink[] = [];
        const linkDistance = 200; // Base distance between nodes

        // Create links between every pair of nodes
        for (let i = 0; i < treeNodes.length; i++) {
          for (let j = i + 1; j < treeNodes.length; j++) {
            treeLinks.push({
              source: treeNodes[i],
              target: treeNodes[j],
              type: 'connection',
              confirmed: true
            });
          }
        }

        // Add this debug log to verify links
        console.log('Created links:', {
          linkCount: treeLinks.length,
          sampleLink: treeLinks[0],
          allLinks: treeLinks
        });

        // Update state
        setNodes(treeNodes);
        setLinks(treeLinks);
        setIsLoading(false);

      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }
    };

    if (session) {
      fetchAllUsers();
    }
  }, [session]);

  useEffect(() => {
    if (!svgRef.current || isLoading || nodes.length === 0) {
      console.log('Early return conditions:', {
        noSvgRef: !svgRef.current,
        isLoading,
        noNodes: nodes.length === 0,
        nodeCount: nodes.length,
        linkCount: links.length
      });
      return;
    }

    console.log('Starting D3 visualization with:', {
      nodes: nodes.length,
      links: links.length,
      sampleNode: nodes[0],
      sampleLink: links[0]
    });

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up the SVG with a viewBox for better scaling
    const width = 2000;  // Increased canvas size
    const height = 1600;
    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', [-width / 2, -height / 2, width, height])
      .style('background-color', 'rgba(255, 255, 255, 0.02)');

    // Create a container group for zoom/pan behavior
    const g = svg.append('g')
      .attr('class', 'container');

    // Add zoom behavior with smooth transitions
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom)
      .call(zoom.transform, d3.zoomIdentity);  // Reset zoom on init

    // Create a force simulation with improved forces
    const simulation = d3.forceSimulation<TreeNode>(nodes)
      .alphaMin(0.001)  // Lower alpha min for smoother transitions
      .alphaDecay(0.02)  // Slower alpha decay
      .velocityDecay(0.3)  // Adjusted for smoother movement
      .force('link', d3.forceLink<TreeNode, TreeLink>(links)
        .id(d => d.id)
        .distance(d => {
          const type = (d as any).type?.toLowerCase() || 'unknown';
          // Adjust distances for different relationship types
          switch(type) {
            case 'spouse':
            case 'husband':
            case 'wife':
              return 100; // Closest distance for spouses
            case 'parent':
            case 'child':
            case 'mother':
            case 'father':
            case 'son':
            case 'daughter':
              return 150; // Parent-child relationships
            case 'sibling':
            case 'brother':
            case 'sister':
              return 200; // Sibling relationships
            case 'cousin':
              return 250; // Cousins
            case 'aunt':
            case 'uncle':
            case 'niece':
            case 'nephew':
              return 300; // Extended family
            case 'grandfather':
            case 'grandmother':
            case 'grandson':
            case 'granddaughter':
              return 350; // Grandparent relationships
            default:
              return 200; // Default distance
          }
        })
        .strength(0.7))
      .force('charge', d3.forceManyBody()
        .strength((d: SimulationNodeDatum) => ((d as unknown) as TreeNode).id === currentUserId ? -1000 : -500)
        .theta(0.8)
        .distanceMax(800))
      .force('collision', d3.forceCollide()
        .radius((d: SimulationNodeDatum) => ((d as unknown) as TreeNode).id === currentUserId ? 100 : 80)
        .strength(0.8)
        .iterations(3))
      .force('center', d3.forceCenter(0, 0).strength(0.05))
      .force('x', d3.forceX().strength(0.02))  // Very weak x force
      .force('y', d3.forceY().strength(0.02));  // Very weak y force

    // Draw links with more visible styling
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'link')
      .style('stroke', '#4A90E2')  // Bright blue color
      .style('stroke-width', 4)    // Increased thickness
      .style('stroke-opacity', 0.8)
      .style('stroke-linecap', 'round');  // Rounded line ends

    console.log('Creating nodes...');

    // Create node groups with hover handlers
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('mouseover', function(event: MouseEvent, d: TreeNode) {
        handleNodeHover(event, d);
      })
      .on('mouseout', function(event: MouseEvent) {
        // Only trigger leave if we're not moving to the menu
        const relatedTarget = event.relatedTarget as HTMLElement;
        if (!relatedTarget?.closest('.node-menu-trigger')) {
          handleNodeLeave();
        }
      });

    // Add circles for nodes
    node.append('circle')
      .attr('r', (d: any) => {
        // Make current user's node bigger
        return d.id === currentUserId ? 50 : 50;
      })
      .style('fill', 'white')
      .style('stroke', (d: any) => d.id === currentUserId ? '#4A90E2' : '#3B35C3')
      .style('stroke-width', (d: any) => d.id === currentUserId ? 3 : 2)
      .style('opacity', 0.9);

    // Add profile images with improved clipping
    const defs = svg.append('defs');
    
    nodes.forEach((d: any) => {
      const clipPath = defs.append('clipPath')
        .attr('id', `clip-${d.id}`);
      
      clipPath.append('circle')
        .attr('r', d.id === currentUserId ? 45 : 35);
    });

    node.append('image')
      .attr('xlink:href', (d: any) => d.profileImage || '')
      .attr('x', (d: any) => d.id === currentUserId ? -45 : -35)
      .attr('y', (d: any) => d.id === currentUserId ? -45 : -35)
      .attr('width', (d: any) => d.id === currentUserId ? 90 : 70)
      .attr('height', (d: any) => d.id === currentUserId ? 90 : 70)
      .attr('clip-path', (d: any) => `url(#clip-${d.id})`);

    // Add name labels
    node.append('text')
      .attr('dy', 60)
      .attr('text-anchor', 'middle')
      .style('fill', '#4a5568')
      .style('font-size', '14px')
      .style('font-weight', '500')
      .text((d: any) => d.name);

    console.log('Setting up simulation tick...');

    // Update the simulation tick function with position clamping
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as TreeNode).x || 0)
        .attr('y1', d => (d.source as TreeNode).y || 0)
        .attr('x2', d => (d.target as TreeNode).x || 0)
        .attr('y2', d => (d.target as TreeNode).y || 0);

      // Keep nodes within visible area
      nodes.forEach(d => {
        d.x = Math.max(-900, Math.min(900, d.x as number));
        d.y = Math.max(-700, Math.min(700, d.y as number));
      });

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Enhanced drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, TreeNode, any>) {
      if (!event.active) {
        simulation
          .alphaTarget(0.3)
          .velocityDecay(0.4)
          .restart();
      }
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
      d3.select(event.sourceEvent.target.closest('.node'))
        .style('cursor', 'grabbing')
        .raise(); // Bring dragged node to front
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, TreeNode, any>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;

      // Enhanced connected nodes movement
      const connectedNodes = new Set<TreeNode>();
      const processedNodes = new Set<TreeNode>();
      
      // Recursive function to find connected nodes up to 2 levels deep
      function findConnectedNodes(node: TreeNode, depth: number) {
        if (depth > 2 || processedNodes.has(node)) return;
        processedNodes.add(node);
        
        links.forEach(link => {
          const source = link.source as TreeNode;
          const target = link.target as TreeNode;
          
          if (source === node && !processedNodes.has(target)) {
            connectedNodes.add(target);
            findConnectedNodes(target, depth + 1);
          } else if (target === node && !processedNodes.has(source)) {
            connectedNodes.add(source);
            findConnectedNodes(source, depth + 1);
          }
        });
      }

      findConnectedNodes(event.subject, 0);

      // Update connected nodes with smooth following
      connectedNodes.forEach(node => {
        const dx = (event.subject.x || 0) - (node.x || 0);
        const dy = (event.subject.y || 0) - (node.y || 0);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate force based on distance
        const strength = Math.min(1, Math.max(0.1, 1 - distance / 500));
        
        if (!node.fx && !node.fy) {  // Only affect unfixed nodes
          node.vx = (node.vx || 0) + dx * strength * 0.05;
          node.vy = (node.vy || 0) + dy * strength * 0.05;
        }
      });

      simulation.alpha(0.5).restart();
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, TreeNode, any>) {
      if (!event.active) {
        simulation
          .alphaTarget(0)
          .velocityDecay(0.3)
          .restart();
      }
      event.subject.fx = null;
      event.subject.fy = null;

      // Smooth reset of connected nodes
      links.forEach(link => {
        const source = link.source as TreeNode;
        const target = link.target as TreeNode;
        [source, target].forEach(node => {
          if (node && node !== event.subject) {
            node.vx = (node.vx || 0) * 0.5;  // Gradual velocity reduction
            node.vy = (node.vy || 0) * 0.5;
          }
        });
      });

      d3.select(event.sourceEvent.target.closest('.node'))
        .style('cursor', 'grab');
    }

    // Apply enhanced drag behavior
    node.call(d3.drag<any, TreeNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended) as any);

    // Initial simulation heating
    simulation.alpha(1).restart();

    return () => {
      simulation.stop();
    };
  }, [nodes, links, isLoading]);

  // Update click handler
  const handleMenuClick = async (event: React.MouseEvent, nodeId: string) => {
    event.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const x = hoveredNode?.x || 0;
    const y = hoveredNode?.y || 0;

    // Check if this is the current user's node
    const isCurrentUser = node.id === currentUserId;
    console.log('Clicked node:', {
      nodeId,
      isCurrentUser,
      email: node.email,
      walletAddress: session?.user?.walletAddress
    });

    // Navigate to settings page
    if (isCurrentUser) {
      router.push('/app/settings');
    } else {
      router.push(`/app/settings/${nodeId}`);
    }

    // Only fetch if we don't have the details yet
    if (!node.userDetails && (node.email || isCurrentUser)) {
      try {
        let response;
        if (isCurrentUser) {
          // For current user, use the appropriate endpoint based on auth method
          if (session?.user?.email) {
            response = await fetch(`/api/users/email/${encodeURIComponent(session.user.email)}`);
          } else if (session?.user?.walletAddress) {
            response = await fetch(`/api/users/wallet/${session.user.walletAddress}`);
          }
        } else {
          // For other users, use email
          response = await fetch(`/api/users/email/${node.email}`);
        }

        if (!response) {
          console.error('No response received from API');
          setSelectedNode({ node, x, y });
          return;
        }

        const data = await response.json();
        
        if (data.success) {
          // Update the node with full user details
          const updatedNode = {
            ...node,
            userDetails: {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              walletAddress: data.user.walletAddress,
              profileImage: data.user.profileImage,
              familyRole: data.user.familyRole,
              gender: data.user.gender,
              occupation: data.user.occupation,
              location: data.user.location,
              birthDay: data.user.birthDay,
              maritalStatus: data.user.maritalStatus,
              bio: data.user.bio,
              phoneNumber: data.user.phoneNumber,
              discordTag: data.user.discordTag
            }
          };

          // Update nodes array with the new data
          setNodes(prevNodes => 
            prevNodes.map(n => n.id === nodeId ? updatedNode : n)
          );

          // Set as selected node
          setSelectedNode({ node: updatedNode, x, y });
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        // Still show the node even if details fetch fails
        setSelectedNode({ node, x, y });
      }
    } else {
      // If we already have the details, just set as selected
      setSelectedNode(prev => prev?.node.id === nodeId ? null : { node, x, y });
    }
  };

  // Add click handler to close menu when clicking outside
  const handleBackgroundClick = () => {
    setSelectedNode(null);
  };

  // Update hover handlers
  const handleNodeHover = (event: MouseEvent, d: TreeNode) => {
    // Clear any existing timer
    if (hoveredNode?.timer) {
      clearTimeout(hoveredNode.timer);
    }
    
    const svg = svgRef.current;
    if (!svg) return;
    
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setIsMenuFading(false);
    setHoveredNode({ nodeId: d.id, x, y });
  };

  const handleNodeLeave = () => {
    // Only start fade if we're not already fading
    if (!isMenuFading && hoveredNode) {
      setIsMenuFading(true);
      
      // Set a timer to actually remove the node after animation
      const timer = setTimeout(() => {
        setHoveredNode(null);
        setIsMenuFading(false);
      }, 3000); // 3 seconds delay

      setHoveredNode(prev => prev ? { ...prev, timer } : null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className={`${className} relative w-full h-full min-h-[600px] border border-gray-200`} onClick={handleBackgroundClick}>
      <svg ref={svgRef} className="w-full h-full absolute inset-0"></svg>
      
      {/* Menu Trigger with fade animation */}
      {hoveredNode && !selectedNode && (
        <div 
          className={`absolute z-50 node-menu-trigger transition-opacity duration-300 ${isMenuFading ? 'opacity-0' : 'opacity-100'}`}
          style={{ 
            left: `${hoveredNode.x + 30}px`, 
            top: `${hoveredNode.y - 10}px`
          }}
          onMouseEnter={() => {
            if (hoveredNode.timer) {
              clearTimeout(hoveredNode.timer);
              setIsMenuFading(false);
            }
          }}
          onMouseLeave={() => {
            handleNodeLeave();
          }}
        >
          <button
            onClick={(e) => {
              if (hoveredNode.timer) {
                clearTimeout(hoveredNode.timer);
              }
              handleMenuClick(e, hoveredNode.nodeId);
            }}
            className="bg-white rounded-full p-1 shadow-lg hover:bg-gray-50 transition-all duration-200 border border-gray-200 flex items-center justify-center w-8 h-8"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-4 h-4 text-gray-600"
            >
              <path d="M4 12a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm6 0a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm8-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
            </svg>
          </button>
        </div>
      )}
      
      {/* Info Panel */}
      {selectedNode && (
        <div 
          className="absolute bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64 z-50 transform -translate-y-1/2"
          style={{ 
            left: `${selectedNode.x + 50}px`,
            top: `${selectedNode.y}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <img 
                src={selectedNode.node.profileImage || '/dashboard/avatar.jpeg'} 
                alt={selectedNode.node.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{selectedNode.node.name}</h3>
                <p className="text-sm text-gray-500">
                  {selectedNode.node.id === currentUserId ? 'You' : selectedNode.node.familyRole}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-3">
            {!selectedNode.node.userDetails ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center text-sm">
                  <span className="w-24 text-gray-500">Discord</span>
                  <span className="text-gray-900">{selectedNode.node.userDetails.discordTag || 'Not specified'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-24 text-gray-500">Name</span>
                  <span className="text-gray-900">{selectedNode.node.userDetails.name || 'Not specified'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-24 text-gray-500">Occupation</span>
                  <span className="text-gray-900">{selectedNode.node.userDetails.occupation || 'Not specified'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-24 text-gray-500">Location</span>
                  <span className="text-gray-900">{selectedNode.node.userDetails.location || 'Not specified'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-24 text-gray-500">Birthday</span>
                  <span className="text-gray-900">
                    {selectedNode.node.userDetails.birthDay 
                      ? new Date(selectedNode.node.userDetails.birthDay).toLocaleDateString()
                      : 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-24 text-gray-500">Status</span>
                  <span className="text-gray-900">{selectedNode.node.userDetails.maritalStatus || 'Not specified'}</span>
                </div>
                {selectedNode.node.id === currentUserId && (
                  <div className="flex items-center text-sm">
                    <span className="w-24 text-gray-500">Auth</span>
                    <span className="text-gray-900">
                      {session?.user?.email ? `Email: ${session.user.email}` : 
                       session?.user?.walletAddress ? `Wallet: ${session.user.walletAddress.slice(0, 6)}...${session.user.walletAddress.slice(-4)}` : 
                       'Not specified'}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 