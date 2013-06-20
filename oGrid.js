/*
* oGrid for pure javascript -  v0.4.3
*
* Copyright (c) 2013 watson chen (code.google.com/p/obj4u/)
* Dual licensed under the GPL Version 3 licenses.
*
*/
var obj4u = obj4u || {};
obj4u.oGrid = oGrid;
obj4u.EventContorller = EventContorller;
function oGrid(fcontainer, params) {
    this.container = fcontainer;
    this.container.className = "oGrid";
    this.totalRow;
    this.rows = [];
    this.columns = [];
    this.loadUrl;
    this.reloadPage = true;

    this.totalPage;
    this.pageNames = ['First', 'Previous', 'Next', 'Last']
    this.pageNumber = 0;
    this.pageSize = 10;
    this.event = new EventContorller(this);

    if (params) {
        if (params.loadUrl) {
            this.loadUrl = params.loadUrl;
        }
        if (params.columns) {
            this.columns = params.columns;
        }
    }

    this.loadData = function (jsonData) {
        if (!jsonData) {
            this.onLog("jsonData is empty.");
            return;
        }
        if (jsonData.rows.length <= 0) {
            this.onLog("jsonData length <= 0.");
            return;
        }

        if (jsonData.total)
            this.totalRow = jsonData.total;
        else
            this.totalRow = jsonData.rows.length;

        if (this.columns.length <= 0) {
            for (var p in jsonData.rows[0]) {
                var col = this.getDefaultColumn();
                col.field = p;
                col.title = p;
                this.addColumn(col);
            }
        }
        var start = this.pageNumber * this.pageSize;
        var last = start + this.pageSize;
        if (last > start + jsonData.rows.length)
            last = start + jsonData.rows.length;

        var z = 0;
        for (var i = start; i < last; ++i) {
            var oldRow = this.rows[i];
            this.rows[i] = jsonData.rows[z];
            this.rows[i].index = i;
            if (oldRow) {
                this.rows[i].selected = oldRow.selected;
            }
            
            z++;
        }
    }
    this.loadFromUrl = function (url, type, async, filter, queryParams) {
        var xmlhttp;
        if (window.XMLHttpRequest) {// code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp = new XMLHttpRequest();
        } else {// code for IE6, IE5
            xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        }
        var obj = this;
        xmlhttp.onreadystatechange = function () {

            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

                var data;
                var ct = xmlhttp.getResponseHeader("content-type"),
		                xml = type == "xml" || !type && ct && ct.indexOf("xml") >= 0,
		                data = xml ? xmlhttp.responseXML : xmlhttp.responseText;

                if (filter)
                    data = filter(data, type);

                //if ( type.toLowerCase() == "script" )
                //jQuery.globalEval( data );

                data = this.onLoadSuccess(data, type);
                // Get the JavaScript object, if JSON is used.
                if (type.toLowerCase() == "json")
                    data = eval("(" + data + ")");

                obj.loadData(data);
                //return data;
                //alert("test" + xmlhttp.response);
            }
        }

        xmlhttp.open("POST", url, async);
        var qry = "";
        if (queryParams) {
            for (var p in queryParams) {
                if (qry.length > 0)
                    qry += "&";
                qry += p + "=" + queryParams[p];
            }
        }
        xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xmlhttp.send(qry);
    }
    this.load = function (queryParams) {
        if (!this.loadUrl) {
            this.onLog("loadUrl is empty.");
            return;
        }

        var furl = this.loadUrl + "?type=data";

        obj.loadFromUrl(furl, 'json', false, null, queryParams);
    }
    this.addColumn = function (col) {
        this.columns[this.columns.length] = col;
        return col;
    }
    this.updateColumn = function (col) {
        for (var i = 0; i < this.columns.length; ++i) {
            if (this.columns[i].field == col.field) {
                this.columns[i] = col;
                break;
            }
        }
        this.columns[this.columns.length] = col;
        return col;
    }
    this.addRows = function (rowData) {
        if (typeof rowData == 'object') {
            if (!rowData.length) {
                this.rows[this.rows.length] = rowData;
                this.totalRow++;
            } else {
                for (var i = 0; i < rowData.length; ++i) {
                    this.rows[this.rows.length] = rowData[i];
                    this.totalRow++;
                }
            }
        }
    }

    function addPageCilckEvent(obj, control, pageNum) {
        control.addEventListener("click",
                         function () {
                             obj.changePageNumber(pageNum);
                         },
                         false);
    }
    this.changePageNumber = function (pageNum) {
        if (pageNum > this.totalPage)
            pageNum = 0;
        this.pageNumber = pageNum;
        var params = {};
        params.page = this.pageNumber;
        params.rows = this.pageSize;
        if (!this.reloadPage) {
            var start = this.pageNumber * this.pageSize;
            if (!this.rows[start]) {
                this.load(params);
            }
        } else
            this.load(params);

        this.renderData();
    }

    this.editRow = function (rowIndex, isEdit) {
        if (rowIndex) {
            this.rows[rowIndex].edit = isEdit;
        }
    }
    this.getSelectRows = function () {
        var selectRows = [];
        for (var i = 0; i < this.rows.length; ++i) {
            if (this.rows[i].selected) {
                selectRows[selectRows.length] = this.rows[i];
            }
        }
        return selectRows;
    }
    this.getDefaultColumn = function () {
        var col = [];
        col.field = "";
        col.title = "";
        col.width = "100px";
        col.colspan = 1;
        col.rowspan = 1;
        col.hidden = false;
        col.sortable = true;
        col.order = "desc";
        col.formatter = null;
        col.styler = null;
        col.editor = null;
        return col;
    }

    this.removeRow = function (rowIndex) {
        if (rowIndex) {
            this.rows.splice(rowIndex, 1);
            this.totalRow--;
        }
    }
    this.insertRow = function (rowIndex, row) {
        if (rowIndex) {
            this.rows.splice(rowIndex, 0, row);
            this.totalRow++;
        }
    }
    this.renderData = function () {
        this.container.innerHTML = "";
        this.totalPage = Math.ceil(this.totalRow / this.pageSize);
        if (this.pageNumber > this.totalPage || this.pageNumber < 0)
            this.pageNumber = 0;

        var rowElement = this.container.insertRow(this.container.rows.length);
        this.renderNavigationHead(rowElement);
        this.renderRowHead();
        var start = this.pageNumber * this.pageSize;
        var last = start + this.pageSize;
        if (last > this.totalRow)
            last = this.totalRow;

        for (var i = start; i < last; ++i) {
            rowElement = this.insertRowElement();
            var row = this.rows[i];
            rowElement.dataIndex = i;
            this.renderRow(rowElement, row);
        }
        rowElement = this.container.insertRow(this.container.rows.length);
        this.renderNavigationFooter(rowElement);
    }

    this.renderRowHead = function () {
        var thead = document.createElement("thead");
        thead.className = "headerrow";
        for (var i = 0; i < this.columns.length; ++i) {
            var th = document.createElement("th");
            th.innerHTML = "&nbsp;" + this.columns[i].title;
            thead.appendChild(th);
        }
        this.container.appendChild(thead);
    }
    this.renderNavigationHead = function (rowElement) {
        //this.renderNavigationBar(rowElement);
    }
    this.renderNavigationFooter = function (rowElement) {
        this.renderNavigationBar(rowElement);
    }
    this.renderNavigationBar = function (rowElement) {
        var td = document.createElement("td");
        td.setAttribute("colspan", this.columns.length);
        var div = document.createElement("div");
        div.className = "pagination";
        var ul = document.createElement("ul");
        var li, li2;
        li = document.createElement("li");
        li.innerHTML = this.pageNames[0];
        if (this.pageNumber == 0) {
            li.className = "disabled";
        } else {
            li.className = "normal";
            addPageCilckEvent(this, li, 0);
        }
        ul.appendChild(li);
        li = document.createElement("li");
        li.innerHTML = this.pageNames[1];
        if (this.pageNumber == 0) {
            li.className = "disabled";
        } else {
            li.className = "normal";
            addPageCilckEvent(this, li, this.pageNumber - 1);
        }
        ul.appendChild(li);

        for (var i = 0; i < this.totalPage; ++i) {
            li = document.createElement("li");
            li.innerHTML = i + 1;
            if (i == this.pageNumber) {
                li.className = "current";
            } else {
                li.className = "normal";
            }

            addPageCilckEvent(this, li, i);
            ul.appendChild(li);
        }

        li = document.createElement("li");
        li.innerHTML = this.pageNames[2];
        if (this.pageNumber == this.totalPage-1) {
            li.className = "disabled";
        } else {
            li.className = "normal";
            addPageCilckEvent(this, li, this.pageNumber + 1);
        }
        ul.appendChild(li);

        li = document.createElement("li");
        li.innerHTML = this.pageNames[3];
        if (this.pageNumber == this.totalPage-1) {
            li.className = "disabled";
        } else {
            li.className = "normal";
            addPageCilckEvent(this, li, this.totalPage-1);
        }
        ul.appendChild(li);

        div.appendChild(ul);
        td.appendChild(div);
        rowElement.appendChild(td);
    }
    this.renderRow = function (rowElement, row) {
        if (!row) {
            this.onLog("row is empty.");
            return;
        }
        if (row.selected) {
            rowElement.oldClassName = rowElement.className;
            rowElement.className = "selected";
        }
        for (var i = 0; i < this.columns.length; ++i) {
            this.renderCell(rowElement, row, this.columns[i]);
        }
    }
    this.renderCell = function (rowElement, row, col) {
        var cell = this.insertCell(rowElement);
        cell.width = col.width;

        if (row.edit) {
            if (col.editor) {
                var editor = new col.editor;
                if (editor.init) {
                    editor.init(cell, "");
                    editor.setValue(row[col.field]);
                }
            }
        } else {
            cell.innerHTML = "&nbsp;" + row[col.field];
        }
        return cell;
    }

    this.selectRow = function (rowElement) {
        var i = rowElement.dataIndex;
        if (!this.rows[i].selected) {
            this.rows[i].selected = true;
            rowElement.oldClassName = rowElement.className;
            rowElement.className = "selected";
            this.onSelectedRow(rowElement, this.rows[i]);
        } else {
            this.rows[i].selected = false;
            rowElement.className = rowElement.oldClassName;
        }
    }
    this.insertRowElement = function () {
        var rowElement = this.container.insertRow(this.container.rows.length);
        var obj = this;
        rowElement.addEventListener("click",
                         function () {
                             obj.selectRow(this);
                         },
                         false);
        if (rowElement.rowIndex % 2 == 1)
            rowElement.className = "datarowodd";
        else
            rowElement.className = "dataroweven";
        return rowElement;
    }
    this.insertCell = function (rowElement) {
        var cellElement = rowElement.insertCell(rowElement.cells.length);
        return cellElement;
    }

    this.onLog = function (msg) {
    }
    this.onLoadSuccess = function (data, type) {
        return data;
    }
    this.onSelectedRow = function (rowElement, row) {
    }
};


function EventContorller(fcontrol) {
    var control = fcontrol;

    this.AddEvent = function (eventName, eventObject) {
        var event = control[eventName];
        if (event)
            control[eventName] = eventObject;
    }
    this.removeEvent = function (eventName) {
        var event = control[eventName];

        if (event)
            control[eventName] = function (){};
    }
}
