class Main {
    constructor() {
        if (!!Main.instance) return Main.instance;
        Main.instance = this;

        return this;
    }

    run() {
        this.#loadData();
    }

    #loadData() {
        console.log("... loading data");
        d3.json("data/data.json", function (data) {
            console.log("... loading data finished:", data);

            console.log("... loading solutions");
            d3.json("data/goodSolutions.json", function (solution) {
                console.log("... loading solutions finished:", solution);
                let sorting = solution[3]["solution"];

                //let sorting = optimizeDirectorSorting(data, sorting);

                graph.createGraph(data, sorting);
            });
        });
    }
}

const main = new Main();
