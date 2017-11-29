/*
 * Copyright (c) 2002-2017 "Neo4j, Inc,"
 * Network Engine for Objects in Lund AB [http://neotechnology.com]
 *
 * This file is part of Neo4j.
 *
 * Neo4j is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const mapProperties = _ => Object.assign({}, ...stringifyValues(_))
const stringifyValues = obj =>
  Object.keys(obj).map(k => ({ [k]: obj[k].toString() }))

export function createGraph (nodes, relationships) {
  let graph = new neo.models.Graph()
  graph.addNodes(mapNodes(nodes))
  graph.addRelationships(mapRelationships(relationships, graph))
  graph.display = { initialNodeDisplay: 300, nodeCount: 1 }
  return graph
}

export function mapNodes (nodes) {
  return nodes.map(
    node =>
      new neo.models.Node(node.id, node.labels, mapProperties(node.properties))
  )
}

export function mapRelationships (relationships, graph) {
  return relationships.map(rel => {
    const source = graph.findNode(rel.startNodeId)
    const target = graph.findNode(rel.endNodeId)
    return new neo.models.Relationship(
      rel.id,
      source,
      target,
      rel.type,
      mapProperties(rel.properties)
    )
  })
}

export function getGraphStats (graph) {
  let labelStats = {}
  let relTypeStats = {}
  graph.nodesTotal().forEach(node => {
    node.labels.forEach(label => {
      if (labelStats['*']) {
        labelStats['*'].count = labelStats['*'].count + 1
      } else {
        labelStats['*'] = {
          count: 1,
          properties: []
        }
      }
      if (labelStats[label]) {
        labelStats[label].count = labelStats[label].count + 1
        labelStats[label].properties = Object.assign(
          {},
          labelStats[label].properties,
          node.propertyMap
        )
      } else {
        labelStats[label] = {
          count: 1,
          properties: node.propertyMap
        }
      }
    })
  })
  graph.relationshipsTotal().forEach(rel => {
    if (relTypeStats['*']) {
      relTypeStats['*'].count = relTypeStats['*'].count + 1
    } else {
      relTypeStats['*'] = {
        count: 1,
        countActive: 1,
        properties: []
      }
    }
    relTypeStats['*'].countActive = graph.relationships().length
    relTypeStats['*'].active = true
    if (relTypeStats[rel.type]) {
      relTypeStats[rel.type].count = relTypeStats[rel.type].count + 1
      let isActive = !graph.inactiveRelationshipsSet().has(rel.type)
      relTypeStats[rel.type].countActive =
        relTypeStats[rel.type].countActive + (isActive ? 1 : 0)
      relTypeStats[rel.type].properties = Object.assign(
        {},
        relTypeStats[rel.type].properties,
        rel.propertyMap
      )
      relTypeStats[rel.type].active = isActive
    } else {
      let isActive = !graph.inactiveRelationshipsSet().has(rel.type)
      relTypeStats[rel.type] = {
        count: 1,
        countActive: isActive ? 1 : 0,
        properties: rel.propertyMap,
        active: isActive
      }
    }
  })
  return { labels: labelStats, relTypes: relTypeStats }
}
