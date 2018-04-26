import React from 'react';
import express from 'express';
import path from 'path';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import expressHandlebars from 'express-handlebars';
import pick from 'lodash.pick';
import LayoutEngine from './LayoutEngine';
import { renderApp, fetchComponentData, matchRouteComponents, createRouterConfig } from './helpers';

const defaultConfig = {
    port: 8080,
    serveStatic: false,
    staticFolder: 'public',
    staticPath: '/public',
    bundleJsFilename: 'bundle.js',
    bundleCssFilename: 'bundle.css',
    contentDivId: 'root',
    layoutUrl: null,
    layoutVariables: {},
    headersToForward: ['user-agent'],
    rootReducer: {},
    routes: [],
    middlewares: []
}

export default class Server {

  constructor(userConfig) {
    this.config = { ...defaultConfig, ...userConfig };
    this.server = express();
    this.layoutEngine = new LayoutEngine(this.config.layoutUrl);
    
    if(this.config.serveStatic) {
      this.server.use(this.config.staticPath, express.static(this.config.staticFolder));
    }

    this.server.engine('handlebars', this.layoutEngine.engine);
    this.server.set('views', path.join(__dirname, 'views'));
    this.server.set('view engine', 'handlebars');
    this.server.set('view cache', true);   
    this.config.middlewares.map(m => this.server.use(m));    

    this.server.use((req, res, next) => {
      const store = createStore(this.config.rootReducer, applyMiddleware(thunk));
      const components = matchRouteComponents(req.path, createRouterConfig(this.config.routes));	
      const layoutPromise = this.layoutEngine.resolveLayout({headers: pick(req.headers, this.config.headersToForward)});
      const componentDataPromise = fetchComponentData(store.dispatch, components, req.path);

      Promise.all([layoutPromise, componentDataPromise])
        .then(([layout]) => {  
          const content = renderApp(req.path, store, this.config.routes);
          res.type("text/html; charset=UTF-8");
          res.render('main', {
            layout,
            state: JSON.stringify(store.getState()),
            content,
            contentDivId: this.config.contentDivId,
            staticPath: this.config.staticPath,
            bundleJsFilename: this.config.bundleJsFilename,
            bundleCssFilename: this.config.bundleCssFilename,
            ...this.config.layoutVariables
          }, 
            (error, html) => error ? next(error) : res.send(html)
          );
        })
    });
  }

  start(callback) {
    this.server.listen(this.config.port, callback);
  }
}
