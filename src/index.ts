// Copyright (c) LSST DM/SQuaRE
// Distributed under the terms of the MIT License.

import {
  Menu
} from '@phosphor/widgets';

import {
  showDialog, Dialog
} from '@jupyterlab/apputils';

import {
  IMainMenu
} from '@jupyterlab/mainmenu';

import {
  JupyterLab, JupyterLabPlugin
} from '@jupyterlab/application';

import {
  IDocumentManager
} from '@jupyterlab/docmanager';


import {
  ServiceManager, ServerConnection
} from '@jupyterlab/services';

import {
  PageConfig
} from '@jupyterlab/coreutils';

import {
  Widget
} from '@phosphor/widgets';

/**
 * The command IDs used by the plugin.
 */
export
namespace CommandIDs {
  export const lsstquery: string = 'lsstquery';
};

/**
 * Interface used by the extension
 */
interface PathContainer {
  path: string;
}


/**
 * Activate the extension.
 */
function activateLSSTQueryExtension(app: JupyterLab, mainMenu: IMainMenu, docManager: IDocumentManager): void {

  console.log('jupyterlab-lsstquery: activated')

  let svcManager = app.serviceManager;

  const { commands } = app;

  commands.addCommand(CommandIDs.lsstquery, {
    label: 'Open from Query ID...',
    caption: 'Open notebook from supplied query ID',
    execute: () => {
      lsstQuery(app, docManager, svcManager)
    }
  });

  // Add commands and menu itmes.
  let menu: Menu.IItemOptions[] =
    [
      { command: CommandIDs.lsstquery },
    ]
  // Put it in the middle of file menu
  let rank = 50;
  mainMenu.fileMenu.addGroup(menu, rank);
}

class QueryHandler extends Widget {
  constructor() {
    super({ node: Private.createQueryNode() });
    this.addClass('jp-lsstqh')
  }

  get inputNode(): HTMLInputElement {
    return this.node.getElementsByTagName('input')[0] as HTMLInputElement;
  }

  getValue(): string {
    return this.inputNode.value;
  }
}



function queryDialog(manager: IDocumentManager): Promise<string | null> {
  let options = {
    title: 'Query ID',
    body: new QueryHandler(),
    focusNodeSelector: 'input',
    buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'CREATE' })]
  }
  return showDialog(options).then((result: any) => {
    if (!result.value) {
      console.log("No result.value from queryDialog");
      return null;
    }
    if (result.button.label === 'CREATE') {
      console.log("Got result ", result.value, " from queryDialog: CREATE")
      return Promise.resolve(result.value);
    }
    console.log("Did not get queryDialog: CREATE")
    return null;
  });
}

function apiRequest(url: string, init: RequestInit, settings: ServerConnection.ISettings): Promise<PathContainer> {
  /**
  * Make a request to our endpoint to get a pointer to a templated
  *  notebook for a given query
  *
  * @param url - the path for the query extension
  *
  * @param init - The POST + body for the extension
  *
  * @param settings - the settings for the current notebook server.
  *
  * @returns a Promise resolved with the JSON response
  */
  // Fake out URL check in makeRequest
  let newSettings = ServerConnection.makeSettings({
    baseUrl: settings.baseUrl,
    pageUrl: settings.pageUrl,
    wsUrl: settings.wsUrl,
    init: settings.init,
    token: settings.token,
    Request: settings.Request,
    Headers: settings.Headers,
    WebSocket: settings.WebSocket
  });
  console.log("url: ", url, "init: ", init, "settings: ", newSettings)
  return ServerConnection.makeRequest(url, init, newSettings).then(
    response => {
      if (response.status !== 200) {
        return response.json().then(data => {
          throw new ServerConnection.ResponseError(response, data.message);
        });
      }
      return response.json();
    });
}

function lsstQuery(app: JupyterLab, docManager: IDocumentManager, svcManager: ServiceManager): Promise<any> {
  let queryid = queryDialog(docManager).then(function(res) {
    return Promise.resolve(res)
  })
  if (!queryid) {
    console.log("queryid was null")
    return new Promise((res, rej) => { })
  }
  console.log("Got queryid: ", queryid)
  let body = JSON.stringify({ "query_id": queryid })
  let endpoint = PageConfig.getBaseUrl() + "lsstquery"
  let init = {
    method: "POST",
    body: body
  }
  let settings = svcManager.serverSettings
  console.log("Endpoint: ", endpoint, " / Body: ", body)
  console.log("Init: ", init, " / Settings: ", settings)
  apiRequest(endpoint, init, settings).then(function(res) {
    let path = res.path
    console.log("Response Resolved: ", res)
    console.log("Path: ", path)
    docManager.open(path)
  });
  return new Promise((res, rej) => { })
}


/**
 * Initialization data for the jupyterlab-lsstquery extension.
 */
const LSSTQueryExtension: JupyterLabPlugin<void> = {
  activate: activateLSSTQueryExtension,
  id: 'jupyter.extensions.jupyterlab-lsstquery',
  requires: [
    IMainMenu,
    IDocumentManager
  ],
  autoStart: true,
};

export default LSSTQueryExtension;

namespace Private {
  /**
   * Create node for query handler.
   */

  export
    function createQueryNode(): HTMLElement {
    let body = document.createElement('div');
    let qidLabel = document.createElement('label');
    qidLabel.textContent = 'Enter Query ID';
    let name = document.createElement('input');
    body.appendChild(qidLabel);
    body.appendChild(name);
    return body;
  }
}
