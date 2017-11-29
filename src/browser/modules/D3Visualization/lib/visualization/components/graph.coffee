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
    @relationshipMap = {}
    @_relationships = []
    @nodeMapTotal = {}
    @_nodesTotal = []
    @relationshipMapTotal = {}
    @_relationshipsTotal = []
    @_inactiveRelationshipsSet = new Set

  nodes: ->
    @_nodes

  nodesTotal: ->
    @_nodesTotal

  relationships: ->
    @_relationships

  relationshipsTotal: ->
    @_relationshipsTotal

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
      if !@findNodeTotal(node.id)?
        @nodeMapTotal[node.id] = node
        @_nodesTotal.push(node)
    @

  removeNode: (node) =>
    if @findNode(node.id)?
      delete @nodeMap[node.id]
      @_nodes.splice(@_nodes.indexOf(node), 1)
    if @findNodeTotal(node.id)?
      delete @nodeMapTotal[node.id]
      @_nodesTotal.splice(@_nodesTotal.indexOf(node), 1)
    @

  updateNode: (node) =>
    if @findNodeTotal(node.id)?
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
      @_relationshipsTotal.splice(@_relationshipsTotal.indexOf(r), 1)
      delete @relationshipMapTotal[r.id]
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
      existingRelationshipTotal = @findRelationshipTotal(relationship.id)
      if existingRelationshipTotal?
        existingRelationshipTotal.internal = false
      else
        relationship.internal = false
        @relationshipMapTotal[relationship.id] = relationship
        @_relationshipsTotal.push(relationship)
    @

  addInternalRelationships: (relationships) =>
    for relationship in relationships
      relationship.internal = true
      if not @findRelationship(relationship.id)?
        @relationshipMap[relationship.id] = relationship
        @_relationships.push(relationship)
      if not @findRelationshipTotal(relationship.id)?
        @relationshipMapTotal[relationship.id] = relationship
        @_relationshipsTotal.push(relationship)
    @

  pruneInternalRelationships: =>
    relationships = @_relationships.filter((relationship) -> not relationship.internal)
    @relationshipMap = {}
    @_relationships = []
    @addRelationships(relationships)

  pruneRelationshipAndSingleNodes: (name) =>
    if @_inactiveRelationshipsSet.has(name)
      @_inactiveRelationshipsSet.delete(name)
    else
      @_inactiveRelationshipsSet.add(name)
    @pruneInactiveRelationshipsAndSingleNodes()

  pruneInactiveRelationshipsAndSingleNodes: =>
    relationships = @_relationshipsTotal.filter((relationship) => !@_inactiveRelationshipsSet.has(relationship.type))
    @relationshipMap = {}
    @_relationships = []
    @addRelationships(relationships)
    nodes = @_nodesTotal.filter((node) => @findAllRelationshipToNode(node).length > 0)
    @nodeMap = {}
    @_nodes = []
    @addNodes(nodes)

  findNode: (id) => @nodeMap[id]

  findNodeTotal: (id) => @nodeMapTotal[id]

  findNodeNeighbourIds: (id) =>
    @_relationshipsTotal
      .filter((relationship) -> relationship.source.id is id or relationship.target.id is id)
      .map((relationship) ->
        if relationship.target.id is id
          return relationship.source.id
        return relationship.target.id
      )

  findRelationship: (id) => @relationshipMap[id]

  findRelationshipTotal: (id) => @relationshipMapTotal[id]

  findAllRelationshipToNode: (node) =>
    @_relationships
      .filter((relationship) -> relationship.source.id is node.id or relationship.target.id is node.id)

   resetGraph: ->
      @nodeMap = {}
      @_nodes = []
      @relationshipMap = {}
      @_relationships = []
      @nodeMapTotal = {}
      @_nodesTotal = []
      @relationshipMapTotal = {}
      @_relationshipsTotal = []
      @_inactiveRelationshipsSet = new Set
