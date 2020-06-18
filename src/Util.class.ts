/**@ignore */
export class Util {
    static isNodejs = (typeof process !== 'undefined' && process.versions && process.versions.node);
    static randomID() {
        return Date.now().toString(36) + Math.random().toString(36);
    }
    static getUrl(req) {
        var scheme = req.headers.referer !== undefined ? req.headers.referer.split(':')[0] : 'http';
        return scheme + '://' + req.headers.host;
    }

    static str2RegExp(input: string) {
        let regExp: RegExp;

        let rxText = input.trim();

        let match = rxText.match(new RegExp('^/(.*?)/([gimy]*)$'));
        if (!match || match[1]) rxText = `/${rxText.replace(/\./g, '\.').replace(/\*/g, '.*')}/`;



        match = rxText.match(new RegExp('^/(.*?)/([gimy]*)$'));
        if (match) regExp = new RegExp(match[1], match[2]);

        return regExp;

    }
}


