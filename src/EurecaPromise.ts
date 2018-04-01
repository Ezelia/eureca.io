/** @ignore */
module Eureca {
    export class EurecaPromise<T> extends Promise<T>{
        //public status=0;
        //public result:any = null;
        //public error: any = null;
        public sig: string = null;
        public resolve: any = null;
        public reject: any = null;

        constructor(executor: (resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void) {
            super(executor);
        }

        //cancel the operation
        public onReady(onfullfilled, onrejected) {
            console.warn('onReady() is deprecated, please use then() instead');
            return this.then(onfullfilled, onrejected);
        }
    }
}