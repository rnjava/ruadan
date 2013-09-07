(function() {
  define(['lodash'], function(_) {
    var Deserializer;
    return Deserializer = (function() {
      function Deserializer(root, idMap) {
        this.root = root;
        this.idMap = idMap != null ? idMap : {};
      }

      Deserializer.prototype.deserialize = function(nodeData, parent) {
        var child, href, node, _i, _len, _ref;
        if (parent == null) {
          parent = this.root;
        }
        if (nodeData == null) {
          return null;
        }
        node = this.idMap[nodeData.id];
        if (node != null) {
          return node;
        }
        switch (nodeData.nodeType) {
          case "" + Node.COMMENT_NODE:
            node = this.root.createComment(nodeData.textContent);
            break;
          case "" + Node.TEXT_NODE:
            node = this.root.createTextNode(nodeData.textContent);
            break;
          case "" + Node.DOCUMENT_TYPE_NODE:
            node = this.root.implementation.createDocumentType(nodeData.name, nodeData.publicId, nodeData.systemId);
            break;
          case "" + Node.ELEMENT_NODE:
            switch (nodeData.tagName) {
              case 'HTML':
                node = this.root.getElementsByTagName("html")[0];
                break;
              case 'HEAD':
                node = this.root.getElementsByTagName("head")[0];
                break;
              case 'BODY':
                node = this.root.getElementsByTagName("body")[0];
                break;
              case 'LINK':
                node = this._createElement("style");
                href = nodeData.attributes["href"];
                nodeData.attributes["xhref"] = href;
                delete nodeData.attributes["href"];
                node.innerHTML = nodeData.styleText;
                break;
              case 'IFRAME':
                node = this.root.createComment('iframe');
                break;
              default:
                node = this._createElement(nodeData.tagName);
            }
            if (nodeData.tagName !== "IFRAME") {
              this._addAttributes(node, nodeData.attributes);
            }
        }
        if (!(nodeData.nodeType === ("" + Node.ELEMENT_NODE) && nodeData.tagName === "IFRAME")) {
          this._addStyle(node, nodeData.styles);
        }
        if (!node) {
          throw "ouch";
        }
        this.idMap[nodeData.id] = node;
        switch (nodeData.tagName) {
          case 'HTML':
          case 'HEAD':
          case 'BODY':
            break;
          default:
            if (parent) {
              parent.appendChild(node);
            }
        }
        if (nodeData.childNodes != null) {
          _ref = nodeData.childNodes;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            child = _ref[_i];
            this.deserialize(child, node);
          }
        }
        return node;
      };

      Deserializer.prototype._createElement = function(tagName) {
        var node;
        switch (tagName) {
          case 'SCRIPT':
            node = this.root.createElement('NO-SCRIPT');
            node.style.display = 'none';
            break;
            break;
          default:
            node = this.root.createElement(tagName);
            break;
        }
        return node;
      };

      Deserializer.prototype._addAttributes = function(node, attributes) {
        _.each(attributes, function(value, key) {
          if (!_.isEmpty(value)) {
            return node.setAttribute(key, value);
          }
        });
        return node;
      };

      Deserializer.prototype._addStyle = function(node, styles) {
        return _.each(styles, function(value, key) {
          return node.style[value[0]] = value[1];
        });
      };

      return Deserializer;

    })();
  });

}).call(this);
