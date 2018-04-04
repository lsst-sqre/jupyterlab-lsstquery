"""
This is a Handler Module with all the individual handlers for LSSTQuery
"""
import json
import os
from jinja2 import Template


from notebook.utils import url_path_join as ujoin
from notebook.base.handlers import APIHandler


class LSSTQuery_handler(APIHandler):
    """
    LSSTQuery Parent Handler.
    """
    @property
    def lsstquery(self):
        return self.settings['lsstquery']

    def post(self):
        """
        POST a queryID and get back a prepopulated notebook.
        """
        self.log.warning(self.request.body)
        post_data = json.loads(self.request.body.decode('utf-8'))
        query_id = post_data["query_id"]
        self.log.debug(query_id)
        result = self._substitute_query(query_id)
        self.finish(json.dumps(result))

    def _substitute_query(self, query_id):
        templatestr = self._get_template()
        template = Template(templatestr)
        body = template.render(query_id=query_id)
        top = os.environ.get("JUPYTERHUB_SERVICE_PREFIX")
        root = os.environ.get("JUPTYER_SERVER_ROOT")
        fname = self._get_filename(query_id)
        fpath = root + "/queries"
        os.makedirs(fpath, exist_ok=True)
        filename = fpath + "/" + fname
        with open(filename, "wb") as f:
            f.write(body)
        retval = {
            "status": 200,
            "filename": filename,
            "url": top + "/tree/" + fpath,
            "body": body
        }
        return retval

    def _get_filename(self, query_id):
        fname = "query-" + str(query_id) + ".ipynb"
        return fname

    def _get_template(self):
        # replace with call to template service
        tmpl = "print({{query_id}})"
        return tmpl


def setup_handlers(web_app):
    """
    Function used to setup all the handlers used.
    """

    print("#######EYECATCHER##########")
    # add the baseurl to our paths
    base_url = web_app.settings['base_url']
    handlers = [(ujoin(base_url, r'/lsstquery/'), LSSTQuery_handler)]
    print("base_url: {}".format(base_url))
    print("handlers: {}".format(str(handlers)))
    print("#######EYECATCHER##########")
    web_app.add_handlers('.*', handlers)
