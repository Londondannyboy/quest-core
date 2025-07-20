'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface NetworkNode {
  id: string
  name: string
  type: 'user' | 'person' | 'organization' | 'skill' | 'goal'
  strength: number
  category?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
}

interface NetworkLink {
  source: string
  target: string
  strength: number
  type: string
}

interface ProfessionalNetworkMiniProps {
  relationships: Array<{
    id: string
    type: string
    from: string
    to: string
    strength: number
    category?: string
    sentiment?: string
  }>
  width?: number
  height?: number
}

export function ProfessionalNetworkMini({ 
  relationships, 
  width = 300, 
  height = 200 
}: ProfessionalNetworkMiniProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || relationships.length === 0) return

    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove()

    // Prepare data
    const nodes: NetworkNode[] = [
      {
        id: 'user',
        name: 'You',
        type: 'user',
        strength: 1.0,
        category: 'user'
      }
    ]

    // Add relationship nodes
    relationships.forEach(rel => {
      if (!nodes.find(n => n.id === rel.to)) {
        nodes.push({
          id: rel.to,
          name: rel.to,
          type: rel.category as any || 'person',
          strength: rel.strength,
          category: rel.category,
          sentiment: rel.sentiment as any
        })
      }
    })

    const links: NetworkLink[] = relationships.map(rel => ({
      source: 'user',
      target: rel.to,
      strength: rel.strength,
      type: rel.type
    }))

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)

    // Create force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(60))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))

    // Color scale for different node types
    const getNodeColor = (type: string, sentiment?: string) => {
      switch (type) {
        case 'user': return '#2563eb'  // Blue
        case 'person': 
          return sentiment === 'positive' ? '#16a34a' : 
                 sentiment === 'negative' ? '#dc2626' : '#6366f1'  // Green/Red/Indigo
        case 'organization': return '#9333ea'  // Purple
        case 'skill': return '#059669'  // Emerald
        case 'goal': return '#ea580c'  // Orange
        default: return '#6b7280'  // Gray
      }
    }

    const getNodeSize = (type: string, strength: number) => {
      const baseSize = type === 'user' ? 12 : 8
      return baseSize * (0.5 + strength * 0.5)
    }

    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-opacity', (d: any) => d.strength * 0.8)
      .attr('stroke-width', (d: any) => Math.max(1, d.strength * 3))

    // Create nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', (d: any) => getNodeSize(d.type, d.strength))
      .attr('fill', (d: any) => getNodeColor(d.type, d.sentiment))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    // Add node labels
    const labels = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text((d: any) => d.name.length > 8 ? d.name.substring(0, 8) + '...' : d.name)
      .attr('font-size', '10px')
      .attr('font-weight', (d: any) => d.type === 'user' ? 'bold' : 'normal')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('fill', '#374151')

    // Add tooltips
    node.append('title')
      .text((d: any) => `${d.name}\nStrength: ${Math.round(d.strength * 100)}%\nType: ${d.type}`)

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y)

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y + getNodeSize(d.type, d.strength) + 12)
    })

    // Cleanup
    return () => {
      simulation.stop()
    }

  }, [relationships, width, height])

  return (
    <div className="bg-slate-50 rounded-lg p-2">
      <svg 
        ref={svgRef}
        className="w-full h-full"
        style={{ minHeight: height }}
      />
    </div>
  )
}