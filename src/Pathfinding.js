class Node {
  constructor(x, y, parent = null) {
    this.x = x;
    this.y = y;
    this.parent = parent;
    this.g = 0; // Cost from start
    this.h = 0; // Heuristic (cost to end)
    this.f = 0; // Total cost (g + h)
  }
}

export class Pathfinding {
  constructor(grid) {
    this.grid = grid;
  }

  findPath(start, end) {
    const openList = [];
    const closedList = [];
    const startNode = new Node(start.x, start.y);
    const endNode = new Node(end.x, end.y);

    openList.push(startNode);

    while (openList.length > 0) {
      let currentNode = openList[0];
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < currentNode.f) {
          currentNode = openList[i];
        }
      }

      openList.splice(openList.indexOf(currentNode), 1);
      closedList.push(currentNode);

      if (currentNode.x === endNode.x && currentNode.y === endNode.y) {
        const path = [];
        let current = currentNode;
        while (current !== null) {
          path.push({ x: current.x, y: current.y });
          current = current.parent;
        }
        return path.reverse();
      }

      const neighbors = this.getNeighbors(currentNode);
      for (const neighbor of neighbors) {
        if (closedList.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
          continue;
        }

        const isDiagonal = (neighbor.x !== currentNode.x && neighbor.y !== currentNode.y);
        const gScore = currentNode.g + (isDiagonal ? 1.4 : 1);

        const existingNode = openList.find(node => node.x === neighbor.x && node.y === neighbor.y);

        if (!existingNode) {
          neighbor.g = gScore;
          const dx = Math.abs(neighbor.x - endNode.x);
          const dy = Math.abs(neighbor.y - endNode.y);
          neighbor.h = (dx + dy) + (1.4 - 2) * Math.min(dx, dy); // Diagonal distance heuristic
          neighbor.f = neighbor.g + neighbor.h;
          neighbor.parent = currentNode;
          openList.push(neighbor);
        } else if (gScore < existingNode.g) {
          existingNode.g = gScore;
          existingNode.f = existingNode.g + existingNode.h;
          existingNode.parent = currentNode;
        }
      }
    }

    return null; // No path found
  }

  getNeighbors(node) {
    const neighbors = [];
    const { x, y } = node;

    // Cardinal directions
    if (x > 0) neighbors.push(new Node(x - 1, y, node));
    if (x < this.grid.width - 1) neighbors.push(new Node(x + 1, y, node));
    if (y > 0) neighbors.push(new Node(x, y - 1, node));
    if (y < this.grid.height - 1) neighbors.push(new Node(x, y + 1, node));

    // Diagonal directions
    if (x > 0 && y > 0) neighbors.push(new Node(x - 1, y - 1, node));
    if (x < this.grid.width - 1 && y > 0) neighbors.push(new Node(x + 1, y - 1, node));
    if (x > 0 && y < this.grid.height - 1) neighbors.push(new Node(x - 1, y + 1, node));
    if (x < this.grid.width - 1 && y < this.grid.height - 1) neighbors.push(new Node(x + 1, y + 1, node));

    return neighbors;
  }
}