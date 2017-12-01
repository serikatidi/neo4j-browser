###!
Copyright (c) 2002-2017 "Neo4j, Inc,"
Network Engine for Objects in Lund AB [http://neotechnology.com]

This file is part of Neo4j.

Neo4j is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
###

'use strict'

class neo.models.Graph
  constructor: () ->
    @nodeMap = {}
    @_nodes = []
    @_inactiveNodesSet = new Set
    @relationshipMap = {}
    @_relationships = []
    @_inactiveRelationshipsSet = new Set

  nodes: ->
    @_nodes

  inactiveNodesSet: ->
    @_inactiveNodesSet

  relationships: ->
    @_relationships

  inactiveRelationshipsSet: ->
    @_inactiveRelationshipsSet

  groupedRelationships: ->
    class NodePair
      constructor: (node1, node2) ->
        @relationships = []
        if node1.id < node2.id
          @nodeA = node1
          @nodeB = node2
        else
          @nodeA = node2
          @nodeB = node1

      isLoop: ->
        @nodeA is @nodeB

      toString: ->
        "#{@nodeA.id}:#{@nodeB.id}"
    groups = {}
    for relationship in @_relationships
      nodePair = new NodePair(relationship.source, relationship.target)
      nodePair = groups[nodePair] ? nodePair
      nodePair.relationships.push relationship
      groups[nodePair] = nodePair
    (pair for ignored, pair of groups)

  addNodes: (nodes) =>
    for node in nodes
      if !@findNode(node.id)?
        @nodeMap[node.id] = node
        @_nodes.push(node)
    @

  removeNode: (node) =>
    if @findNode(node.id)?
      delete @nodeMap[node.id]
      @_nodes.splice(@_nodes.indexOf(node), 1)
    @

  updateNode: (node) =>
    if @findNode(node.id)?
      @removeNode node
      node.expanded = false
      node.minified = true
      @addNodes [node]
    @

  removeConnectedRelationships: (node) =>
    for r in @findAllRelationshipToNode node
      @updateNode r.source
      @updateNode r.target
      @_relationships.splice(@_relationships.indexOf(r), 1)
      delete @relationshipMap[r.id]
    @

  addRelationships: (relationships) =>
    for relationship in relationships
      existingRelationship = @findRelationship(relationship.id)
      if existingRelationship?
        existingRelationship.internal = false
      else
        relationship.internal = false
        @relationshipMap[relationship.id] = relationship
        @_relationships.push(relationship)
    @

  addInternalRelationships: (relationships) =>
    for relationship in relationships
      relationship.internal = true
      if not @findRelationship(relationship.id)?
        @relationshipMap[relationship.id] = relationship
        @_relationships.push(relationship)
    @

  pruneInternalRelationships: =>
    relationships = @_relationships.filter((relationship) -> not relationship.internal)
    @relationshipMap = {}
    @_relationships = []
    @addRelationships(relationships)

  pruneNodeAndRelationships: (name) =>
    if @_inactiveNodesSet.has(name)
      @_inactiveNodesSet.delete(name)
    else
      @_inactiveNodesSet.add(name)
    @pruneNodesAndRelationships()

  pruneRelationshipAndSingleNodes: (name) =>
    if @_inactiveRelationshipsSet.has(name)
      @_inactiveRelationshipsSet.delete(name)
    else
      @_inactiveRelationshipsSet.add(name)
    @pruneNodesAndRelationships()

  pruneNodesAndRelationships: =>
    @_nodes = @_nodes.map((node) => @updateNodeState(node))
    @_relationships = @_relationships.map((relationship) => @updateRelationState(relationship))
    @_relationships = @_relationships.map((relationship) => @updateRelationStateFromNodes(relationship))
    if @_relationships.length > 0
      @_nodes = @_nodes.map((node) => @updateNodeStateFromRelationships(node))
    @updateNodeMapStates()
    @updateRelationshipMapStates()

  updateRelationshipMapStates: =>
    for relationship in @_relationships
      @relationshipMap[relationship.id] = relationship

  updateNodeMapStates: =>
    for node in @_nodes
      @nodeMap[node.id] = node

  updateNodeState: (node) =>
    if @_inactiveNodesSet.has(node.labels[0])
      node.active = false
    else
      node.active = true
    node
  
  updateRelationState: (relationship) =>
    if @_inactiveRelationshipsSet.has(relationship.type)
      relationship.active = false
    else
      relationship.active = true
    relationship

  updateRelationStateFromNodes: (relationship) =>
    if @nodeMap[relationship.source.id].active && @nodeMap[relationship.target.id].active && !@_inactiveRelationshipsSet.has(relationship.type)
      relationship.active = true
    else
      relationship.active = false
    relationship
  
  updateNodeStateFromRelationships: (node) =>
    if @findAllRelationshipToActiveNode(node).length > 0
      node.active = true
    else
      node.active = false
    node

  findNode: (id) => @nodeMap[id]

  findNodeNeighbourIds: (id) =>
    @_relationships
      .filter((relationship) -> relationship.source.id is id or relationship.target.id is id)
      .map((relationship) ->
        if relationship.target.id is id
          return relationship.source.id
        return relationship.target.id
      )

  findRelationship: (id) => @relationshipMap[id]

  findAllRelationshipToNode: (node) =>
    @_relationships
      .filter((relationship) -> relationship.source.id is node.id or relationship.target.id is node.id)

  findAllRelationshipToActiveNode: (node) =>
    @findAllRelationshipToNode(node).filter((relationship) -> relationship.active)

  findAllActiveNodes: =>
    @_nodes.filter((node) -> node.active)
  
  findAllActiveRelationships: =>
    @_relationships.filter((relationship) -> relationship.active)

   resetGraph: ->
      @nodeMap = {}
      @_nodes = []
      @relationshipMap = {}
      @_relationships = []
      @_inactiveRelationshipsSet = new Set
