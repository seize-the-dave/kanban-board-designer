package uk.co.sustainablepace.kanbanboarddesigner;

import java.util.ArrayList;
import java.util.List;

public class Board {
    private final List<String> columns = new ArrayList<String>();

    public Board() {
        columns.add("Backlog");
        columns.add("Ready");
        columns.add("In Progress");
        columns.add("Done");
    }

    public List<String> getColumns() {
        return columns;
    }
}
