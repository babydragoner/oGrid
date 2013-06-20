obj4u - object for you
=====

oGrid is a pure javascript grid and it's object oriented design.

Features
* pure javascript grid.
* object oriented design.
* Easy to inherits or override oGrid to make yourself grid.
* It can load JSON data from local or URL.
* It can save page data in cache.
* paging bar.

Sample Code

        var obj;
        window.onload = function () {
            obj = new obj4u.oGrid(dataTable);
            obj.loadData(rawData);
            obj.renderData();
            obj.event.AddEvent("onSelectedRow", oGrid_SelectedRow);
        }

        function oGrid_SelectedRow(rowElement, row)
        {
          var selectedRows = obj.getSelectRows();
          alert(rowElement.rowIndex+ " - " + selectedRows.length + "," + row["productid"]);
        }
