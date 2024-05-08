import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { SubmitButtonExtension } from './submitButton';

/**
 * Initialization data for the jupyterWebCatConnect extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterWebCatConnect:plugin',
  description: 'A JupyterLab extension to submit notebook to webcat',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('jupyterWebCatConnect is activated!');

    const submitButtonExtension = new SubmitButtonExtension();
    app.docRegistry.addWidgetExtension('Notebook', submitButtonExtension);
  }
};

export default plugin;