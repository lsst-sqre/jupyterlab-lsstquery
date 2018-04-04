// Copyright (c) LSST DM/SQuaRE
// Distributed under the terms of the MIT License.

import {
  Menu
} from '@phosphor/widgets';

//import {
//  showDialog, Dialog
//} from '@jupyterlab/apputils';

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

/**
 * The command IDs used by the plugin.
 */
export
namespace CommandIDs {
  export const lsstquery: string = 'lsstquery';
};


/**
 * Activate the extension.
 */
function activateLSSTQueryExtension(app: JupyterLab, mainMenu: IMainMenu, docManager: IDocumentManager): void {

  console.log('jupyterlab-lsstquery: activated')

  let svcManager = app.serviceManager;

  const { commands } = app;

  commands.addCommand(CommandIDs.lsstquery, {
    label: 'Open from query ID',
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

function apiRequest(url: string, init: RequestInit, settings: ServerConnection.ISettings): Promise<Response> {
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
  return ServerConnection.makeRequest(url, init, newSettings)
}

function lsstQuery(app: JupyterLab, docManager: IDocumentManager, svcManager: ServiceManager): Promise<any> {
  let queryid = 3; // Get from dialog
  let body = JSON.stringify({ "query_id": queryid })
  let endpoint = PageConfig.getBaseUrl() + "lsstquery/"
  let init = {
    method: "POST",
    body: body
  }
  let settings = svcManager.serverSettings
  console.log("Endpoint: ", endpoint, " / Body: ", body)
  console.log("Init: ", init, " / Settings: ", settings)
  let r = apiRequest(endpoint, init, settings)
    .then((response => {
      let status = response.status
      console.log("Status ", status, "=>", response)
      if (status < 200 || status >= 300) {
        Promise.reject(new ServerConnection.ResponseError(response))
      }
      return response
    })
    );
  return r
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

