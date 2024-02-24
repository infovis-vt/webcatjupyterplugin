import json


from jupyter_server.base.handlers import APIHandler, JupyterHandler
from jupyter_server.utils import url_path_join
import tornado
import os
import urllib
import requests
from bs4 import BeautifulSoup


class WebCatHandler(JupyterHandler):

    @property
    def notebook_dir(self):
        parsed_dir = urllib.parse.urlparse(self.settings["page_config_data"]["rootUri"]).path
        return parsed_dir

    def error_and_return(self, dirname, reason):
        # send error
        self.send_error(500, reason=reason)
        # return to directory
        os.chdir(dirname)
    
    @tornado.web.authenticated
    def put(self):

        # obtain filename and msg for commit
        data = json.loads(self.request.body.decode('utf-8'))
        filename = urllib.parse.unquote(data['filename'])
        course = urllib.parse.unquote(data['course'])
        assignment = urllib.parse.unquote(data['a'])
        institute = urllib.parse.unquote(data['d'])

        payload = {
            'course': course,
            'a': assignment,
            'd': institute
            }

        url = 'https://web-cat.cs.vt.edu/Web-CAT/WebObjects/Web-CAT.woa/wa/submit'

        filepath = self.notebook_dir +'/' + filename

        files = {'file1': open(filepath, 'rb')}
        redirect_link = ""
        try:
            response = requests.post(url, data=payload, files=files)
            soup = BeautifulSoup(response.content, "html.parser")
            for link in soup.findAll('a'):
                redirect_link = link.get('href')
        except Exception as e:
            print(e)
            self.error_and_return(filepath, "Could send request because: "+ str(e))
            return

        # close connection
        self.write(json.dumps({'status': 200,
                               'statusText': self.notebook_dir+"/"+filename,
                               'responseText': response.content.decode("utf-8"),
                               'redirectLink': redirect_link}))      
            




def setup_handlers(web_app):
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]
    
    route_pattern = url_path_join(base_url, "jupyterWebCatConnect", "webcat")
    handlers = [(route_pattern, WebCatHandler)]
    web_app.add_handlers(host_pattern, handlers)
    
    
