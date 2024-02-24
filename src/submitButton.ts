import { ToolbarButton, } from '@jupyterlab/apputils';
import { DocumentRegistry } from "@jupyterlab/docregistry";
import { INotebookModel, NotebookPanel } from "@jupyterlab/notebook";
import { IDisposable } from "@lumino/disposable";
import { URLExt } from '@jupyterlab/coreutils';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { ServerConnection } from '@jupyterlab/services';
import { Widget } from '@lumino/widgets';

interface ResponseData {
    status: number;
    statusText: string;
    responseText: string;
    redirectLink: string;
}

class NotFoundError extends Error {
    constructor(message: string = "Not Found") {
        super(message);
        this.name = "NotFoundError";
    }
}

export class SubmitButtonExtension implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
    createNew(panel: NotebookPanel, context: DocumentRegistry.IContext<INotebookModel>): IDisposable {
        const onClick = async () => {
            console.log('Submit button clicked!');

            console.log(document.cookie);


            // Get the notebook path
            const filepath = panel.context.contentsModel?.path || '';
            console.log(filepath);

            // Save the notebook
            await context.save();

            // Get the notebook content 

            var payload;
            try {
                const elements = document.querySelectorAll('.jp-Notebook-cell');
                const elementsArray = Array.from(elements);
                console.log(elementsArray[0])
                if (elementsArray.length === 0) {
                    console.log('No config cell found');
                    throw new NotFoundError('No config cell found');
                }
                const firstcellContent = elementsArray[0].querySelector('.jp-InputArea-editor')!.textContent || '';
                console.log(firstcellContent);
                const coursePattern = /course: (\d+)/;
                const aValuePattern = /a: (.+?)#/;
                const dValuePattern = /d: (.+?)$/;
    
                const course = (firstcellContent.match(coursePattern) || [])[1] || null;
                const assignemntName = (firstcellContent.match(aValuePattern) || [])[1] || null;
                const college = (firstcellContent.match(dValuePattern) || [])[1] || null;
                console.log(course);
                console.log(assignemntName);
                console.log(college);
                if (!course || !assignemntName || !college) {
                    throw new SyntaxError('Invalid config cell');
                }
                payload = {
                    'filename': filepath,
                    'course': course,
                    'a': assignemntName,
                    'd': college
                };
                
            } catch (error) {
                if (error instanceof NotFoundError) {
                    alert("No cell found. Notebook is empty. Please add a cell with the assignment parameters");
                    return;
                }
                if (error instanceof SyntaxError) {
                    alert("Invalid config cell found. Make sure your first cell contains your assignment parameters. For example: \n\n"
                    + "# Do not edit this cell\n\n"
                    + "# course: 123\n"
                    + "# a: Assignment_1\n"
                    + "# d: VT");
                    return;
                }

            }

            console.log(payload);

            const settings = ServerConnection.makeSettings();
            const requestUrl = URLExt.join(
                settings.baseUrl,
                'jupyterWebCatConnect', // API Namespace
                'webcat'   // API endpoint defined in the jupyter_webcat_connect/handlers.py
            );
            console.log(requestUrl);
            let response: Response;
            const init: RequestInit = {
                method: 'PUT',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            console.log(init);
            try {
                response = await ServerConnection.makeRequest(requestUrl, init, settings);
            } catch (error) {
                //handle any error in request
                throw new ServerConnection.NetworkError(error as any);
            }
            console.log(document.cookie);
            
            if (response.ok) {
                try {
                    const data = await response.json() as ResponseData;
                    console.log("data", data);
                
                    // Create the iframe element
                    const iframe = document.createElement('iframe');
                    console.log("1");
                    iframe.src = data.redirectLink;
                    iframe.width = '650';
                    iframe.height = '500';
                
                    // Create the dialog body element
                    const dialogBody = document.createElement('div');
                    dialogBody.appendChild(iframe);
                    console.log("2");
                    const bodyWidget = new Widget({ node: dialogBody });
                
                    console.log("3");
                    // Send the notebook content to the server
                    console.log("bodyWidget", bodyWidget);
                    console.log("showDialog", showDialog);
                    console.log("Dialog.warnButton", bodyWidget.parent);
                    void showDialog({
                      title: "Web-CAT",
                      body: bodyWidget,
                      buttons: [Dialog.warnButton({ label: 'Close' })]
                    });
                    console.log("4");
                    console.log("Dialog.warnButton", bodyWidget.parent);
                  } catch (error) {
                    console.error('Error processing response:', error);
                    alert("Error processing response. Please check the server logs for more details.");
                    // Handle the error here, show a user-friendly message, etc.
                }
                
            }
            else {
                const data = await response.json();
                console.log(data);
                throw new ServerConnection.ResponseError(response, data);
            }
        }
        const button = new ToolbarButton({
            className: 'myButton',
            label: 'Submit to Web-Cat',
            // iconClassName: 'fa fa-fast-forward',
            onClick: onClick,
            tooltip: 'Submit to WebCat'
        });
        panel.toolbar.insertItem(9, 'Submit to Web-Cat', button);
        return button;
    }
}