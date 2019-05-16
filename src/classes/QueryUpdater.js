import { GraphqlClient } from './GraphqlClient';

export class QueryUpdater {

  data = {};
  errors = null;
  loading = true;
  requireUpdate = false;

  constructor(forceUpdate, query, onError, onComplete, skip = false) {
    this.forceUpdate = forceUpdate;
    this.query = query;
    this.onError = onError;
    this.onComplete = onComplete;
    this.skip = skip;

    this.addToSuspended = this.addToSuspended.bind(this);
    this.removeFromSuspended = this.removeFromSuspended.bind(this);
    this.handleSubscriptions = this.handleSubscriptions.bind(this);

    this.deleteDataKey = this.deleteDataKey.bind(this);
    this.createDataKey = this.createDataKey.bind(this);
  }

  addToSuspended() {
    if (this.skip) return;
    GraphqlClient.elements.push([this.query, this.variables]);
    this.loading = true;
    GraphqlClient.suspendedQueue++;
  }
  removeFromSuspended() {
    if (this.skip) return;
    GraphqlClient.suspendedQueue--;
  }

  makeLoading() {
    this.loading = true;
    this.requireUpdate = true;
  }
  deleteDataKey(key) {
    delete this.data[key]
  }
  createDataKey([key, value]) {
    this.data[key] = value;
  }
  makeComplete({ data, errors }) {
    this.loading = false;

    Object.keys(this.data).forEach(this.deleteDataKey);
    Object.entries(data).forEach(this.createDataKey);
    //this.data = data;
    
    this.errors = errors;
    this.requireUpdate = true;
    if (errors === null) this.onComplete?.(data);
    else this.onError?.(errors);
  }

  test() {
    if (!this.requireUpdate) return false;
    this.requireUpdate = false;
    return true;
  }
  update() {
    if(this.test()) this.forceUpdate();
  }

  handleSubscriptions() {
    GraphqlClient.updaters.push(this);
    return () => {
      GraphqlClient.updaters.splice(GraphqlClient.updaters.indexOf(this), 1);
    };
  }

}