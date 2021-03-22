function init() {
    // set the dimensions and margins of the graph
    var margin = {top: 20, right: 30, bottom: 20, left: 30},
        width = window.innerWidth - margin.left - margin.right,
        height = window.innerHeight - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // Read dummy data
    d3.json("data.json", function (data) {
        console.log(data);

        // List of node names
        var allNodes = data.nodes.map(function (d) {
            return d.id
        })

        // A linear scale to position the nodes on the X axis
        var x = d3.scalePoint()
            .range([0, width])
            .domain(allNodes)

        // Add the circle for the nodes
        svg
            .selectAll("mynodes")
            .data(data.nodes)
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                return (x(d.id))
            })
            .attr("cy", height - 170)
            .attr("r", 4)
            .style("fill", function (d) {
                console.log(d.original);
                console.log(typeof d.original);
                return d.original ? "red" : "blue";
            })

        // And give them a label
        svg
            .selectAll("mylabels")
            .data(data.nodes)
            .enter()
            .append("text")
            .attr("y", function (d) {
                return -(x(d.id))
            })
            .attr("x", 10)
            .attr("transform", function(d) {
                return "translate(" + -4 + " " + (height - 170) + ") rotate(90)"
            })
            .text(function (d) {
                return (d.name)
            })
            .attr("font-size", "x-small")
            .style("text-anchor", "left")

        // Add links between nodes. Here is the tricky part.
        // In my input data, links are provided between nodes -id-, NOT between node names.
        // So I have to do a link between this id and the name
        var idToNode = {};
        data.nodes.forEach(function (n) {
            idToNode[n.id] = n;
        });
        // Cool, now if I do idToNode["2"].name I've got the name of the node with id 2

        // Add the links
        svg
            .selectAll('mylinks')
            .data(data.links)
            .enter()
            .append('path')
            .attr('d', function (d) {
                start = x(idToNode[d.source].id)    // X position of start node on the X axis
                end = x(idToNode[d.target].id)      // X position of end node
                return ['M', start, height - 170,    // the arc starts at the coordinate x=start, y=height-30 (where the starting node is)
                    'A',                            // This means we're gonna build an elliptical arc
                    (start - end) / 2, ',',    // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
                    (start - end) / 2, 0, 0, ',',
                    start < end ? 1 : 0, end, ',', height - 170] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
                    .join(' ');
            })
            .style("fill", "none")
            .attr("stroke", "black")
    })
}