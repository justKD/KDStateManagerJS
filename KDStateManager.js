/**
 * @file kdstatemanager.js
 * @author justKD
 * @copyright justKD 2019
 * @license MIT https://notnatural.co/license/
 * @fileoverview 
 */

/**
 *  Class representing a manager for storing and recalling JSON objects representing state values.
 * 
 *  The template is an object of keyed functions that should operate on an expected value/type.
 *  A state is an object of keys (and any values) that correspond with templated keys.
 *  When a state is recalled, if any keys in the recalled state match keys in the template, the state value will be passed to
 *  the templated function.
 * 
 *  Store by inserting or appending a state, recall or delete a state by index, infinite undo/redo.
 */
class KDStateManager {

    /**
     * Parameter object for the `KDStateManager` constructor.
     * @typedef {object} KDStateManager~Params
     * @property {boolean=} dev - Indicated whether dev mode logging is activated.
     * @property {array=} store - Instantiate the instance with a pre-existing `store`.
     * @property {number=} currentIndex - Instantiate the instance with a predetermined `currentIndex`.
     */

    /**
     *  Instantiates a `new KDStateManager()`.
     * 
     *  @param {object=} template - Object containing keyed functions. Keys should match the keys for any state objects 
     *                              that will be stored, and the values should be functions handling the state values.
     *  @param {KDStateManager~Params=} params - Optional parameters `dev`, `store`, and `currentIndex`.
     * 
     *  @notes Class representing a manager for storing and recalling JSON objects representing state values.
     *         The template is an object of keyed functions that should operate on an expected value/type.
     *         A state is an object of keys (and any values) that correspond with templated keys.
     *         When a state is recalled, if any keys in the recalled state match keys in the template, the state value will be passed to
     *         the templated function. Store by inserting or appending a state, recall or delete a state by index, infinite undo/redo.
     *  
     *  @public
     *      devMode()
     *      onError()
     *      index
     *          .set()
     *          .current()
     *          .first()
     *          .last()
     *      template()
     *      store()
     *      localStorage
     *          .set()
     *          .get()
     *      append()
     *      recall()
     *      delete()
     *      insert()
     *      replace()
     *      undo()
     *      redo()
     * 
     * @example
     * 
     *      const state = {
     *          level: 34,
     *          class: 'warrior',
     *          stats: [5, 5, 5, 5],
     *          equip: {
     *              hands: gloves,
     *              head: hat,
     *          },
     *      }
     * 
     *      const state2 = {
     *          level: 50,
     *          class: 'warrior',
     *          stats: [10, 10, 10, 10],
     *          equip: {
     *              hands: betterGloves,
     *              head: biggerHat,
     *          },
     *      }
     * 
     *      const stateManager = new KDStateManager({
     *          level: value => handleLevel(value),
     *          class: value => setClass(value),
     *          stats: value => stats.forEach(stat => handleStat(stat)),
     *          equip: value => {
     *              equip(value.hands)
     *              equip(value.hat)
     *          },
     *      }, {
     *          dev: true
     *      })
     * 
     *      stateManager.append(state)
     *      stateManager.append(state2)
     *      console.log( s == state )
     *      stateManager.undo(s => console.log( s == state ))
     *      stateManager.redo(s => console.log( s == state2 ))
     *      stateManager.recall(0, s => console.log( s == state ))
     *      
     */
    constructor(template, params) {

        /** Utilities for dev mode logging. */
        const dev = {

            /** Determines whether `start()`, `end()`, and `log()` will run. `error()` always runs if called directly. */
            mode: params.dev ? params.dev : false,

            /** `onError()` callback function and `colors`. */
            props: {
                onError: e => console.log('%c ' + e + ' ', dev.console.text(dev.props.colors.error)),
                colors: {
                    error: '#F1828D',
                    log: '#FEFAD4',
                    start: '#8FB9A8',
                },
            },

            /** Format css for console calls. */
            console: {
                text: color => 'color:' + color + ';',
                background: color => 'background:' + color + ';',
            },

            /**
             * Open a console group. Useful at the start of a function.
             * @param {string=} title - The group title or primary message.
             * @param {any=} msg - Anything else to be logged on the first line within the group.
             * @param {boolean=} trace - If true, `console.trace()` will be logged at the end of the group.
             */
            start: (title, msg, trace) => {
                if (dev.mode) {
                    title = typeof title === 'string' ? title : ' '
                    console.groupCollapsed('%c' + title, dev.console.text(dev.props.colors.start) + 'font-weight: normal;')
                    if (msg != undefined) console.log(msg)
                    if (trace) console.trace()
                }
            },

            /**
             * End a console group. Useful at the end of a function.
             * @param {boolean} success - Determines which callback function to run.
             * @param {function=} onSuccess - Called on success.
             * @param {function=} onFail - Called on fail. Good place for `dev.error()`
             * @param {boolean=} trace - If true, `console.trace()` will be logged at the end of the group.
             */
            end: (success, onSuccess, onFail, trace) => {
                if (dev.mode) {
                    if (success) {
                        if (typeof onSuccess === 'function') onSuccess()
                    } else {
                        if (typeof onFail === 'function') onFail()
                    }
                    if (trace) console.trace()
                    console.groupEnd()
                    if (!success) console.log('%c^ Failed ', dev.console.background(dev.props.colors.error) + dev.console.text('#000'))
                }
            },

            /**
             * Open a console group and `console.log()` with text formatting and optional stack trace.
             * @param {string=} title - The group title or primary message.
             * @param {any=} msg - Anything to be logged.
             * @param {boolean=} trace - If true, `console.trace()` will be logged.
             */
            log: (title, msg, trace) => {
                if (dev.mode) {
                    let opts = null
                    if (title) {
                        title = typeof title === 'string' ? title : ' '
                        opts = '%c' + title, dev.console.text(dev.props.colors.log) + 'font-weight: normal;'
                    }
                    console.group('%c' + title, dev.console.text(dev.props.colors.log) + 'font-weight: normal;')
                    console.log(msg)
                    if (trace) console.trace()
                    console.groupEnd()
                }
            },

            /**
             * Format and log a `new Error()`. If called directly (not from within a `.start` or `.end` fucntion), always logs 
             * regardless of `.mode` state. Also always logs `console.trace()`.
             * @param {string=} msg - Error message to be logged.
             * @param {function=} callback - Callback function. `new Error(msg)` is passed to this function. Defaults to
             * `props.onError()`.
             */
            error: (msg, callback) => {
                callback = callback ? callback : dev.props.onError
                if (typeof callback === 'function') callback(new Error(msg))
                else console.log('%c ' + e + ' ', dev.console.color(dev.props.colors.error))
                console.trace()
            },

        }

        /**
         * Toggle detailed console logging for the instance.
         * @param {boolean} on
         */
        this.devMode = on => dev.mode = on
        /**
         * Set the `dev.props.onError` callback function.
         * @param {function=} err - Default error function.
         */
        this.onError = err => dev.props.onError = err

        /** Make a copy of an object with no references to the original or its properties. */
        const deepCopy = obj => JSON.parse(JSON.stringify(obj))
        /** Handle callback functions throughout the class. */
        const handleCB = (cb, success) => typeof cb === 'function' ? cb(success) : dev.log('handleCB', 'no valid callback')

        /** Check to ensure a `template` consists only of keyed `functions`. */
        const checkTemplate = template => {
            let success = true
            if (typeof template === 'object') {
                Object.values(template).forEach(value => {
                    if (typeof value != 'function') success = false
                })
            } else success = false
            return success
        }

        /** Hold mutable state properties. */
        const _state = {
            /** See `this.template()`. */
            template: checkTemplate(template) ? template : {},
            /** Array of stored state objects. */
            store: Array.isArray(params.store) ? params.store : [],
            /** Current index used with `undo`/`redo`. */
            currentIndex: (params.currentIndex != undefined && params.currentIndex > -1) ? params.currentIndex : -1,
        }

        /** Holds private functions. See the public functions for descriptions. */
        const _private = {

            template: (template, callback) => {
                let success = false
                const t = deepCopy(template)
                // Add better template type checking?
                if (checkTemplate(t)) {
                    _state.template = t
                    success = t
                }
                handleCB(callback, success)
                return success
            },

            store: (store, callback) => {
                let success = false
                const s = deepCopy(store)
                if (Array.isArray(s)) {
                    _state.store = s
                    _state.currentIndex = this.index.last()
                    success = s
                }
                handleCB(callback, success)
                return success
            },

            localStorage: {
                set: (key, callback) => {
                    localStorage.setItem(key, JSON.stringify(deepCopy(_state)))
                    handleCB(callback, true)
                    return true
                },
                get: (key, callback) => {
                    let retrieved = localStorage.getItem(key)
                    if (retrieved) {
                        retrieved = JSON.parse(retrieved)
                        _state = deepCopy(retrieved)
                    }
                    handleCB(callback, retrieved)
                    return retrieved
                },
            },

            append: (state, callback) => {
                const s = deepCopy(state)
                _state.store.push(s)
                _state.currentIndex = _state.store.length - 1
                handleCB(callback, s)
                return s
            },

            recall: (index, callback) => {
                let success = false
                if (_state.store[index]) {
                    _state.currentIndex = index
                    success = deepCopy(_state.store[index])
                    Object.keys(_state.template).forEach(key => {
                        if (_state.template[key]) _state.template[key](success[key])
                    })
                }
                handleCB(callback, success)
                return success
            },

            delete: (index, callback) => {
                let success = false
                if (_state.store[index]) {
                    success = deepCopy(_state.store[index])
                    _state.store.splice(index, 1)
                    _state.currentIndex--
                }
                handleCB(callback, success)
                return success
            },

            insert: (index, state, callback) => {
                let success = false
                const st = deepCopy(state)
                if (_state.store[index] || index == _state.store.length) {
                    _state.store.splice(index, 0, st)
                    index < _state.currentIndex ? _state.currentIndex++ : ''
                    success = st
                } else if (index > -1) {
                    _state.store.push(st)
                    _state.currentIndex = _state.store.length
                    success = st
                }
                handleCB(callback, success)
                return success
            },

            replace: (index, state, callback) => {
                const success = _private.delete(index, _ => {})
                if (success) return _private.insert(index, state, callback)
            },

            undo: callback => _state.currentIndex > 0 ? _private.recall((_state.currentIndex - 1), callback) : false,

            redo: callback => _state.currentIndex < this.index.last() ? _private.recall((_state.currentIndex + 1), callback) : false,

        }

        /** Object holding functions for getting/setting indices used with `store`, `undo()`, and `redo()`. */
        this.index = {
            /**
             * Set the `currentIndex`.
             * @param {number} index
             * @error Fails if the passed `index` does not exist in the `store`.
             */
            set: index => _state.store[index] ? _state.currentIndex = index : dev.error('Unable to set current index.\n Invalid index (' + index + ').'),
            /** @returns a deep copy of the `currentIndex`. */
            current: _ => deepCopy(_state.currentIndex),
            /** @returns the index for the last element in the `store`. */
            last: _ => _state.store.length - 1,
            /** @returns the index for the first element in the `store`. */
            first: _ => 0,
        }

        /**
         * Get/set the `template`. The template is the set of functions that will be run for each key when a state is recalled.
         * @param {object=} template - Object containing keyed functions. Keys should match the keys for any state objects 
         *                             that will be stored, and the values should be functions handling the state values.
         * @param {function=} callback - The returned template is also passed as a parameter to the callback.
         * @notes The value will be stored as a deep copy with no references.
         * @returns {object} The newly copied `template`.
         * @error Fails if the `template` is invalid.
         * @example
         * 
         *      const state = {
         *          level: 34,
         *          class: 'warrior',
         *          stats: [5, 5, 5, 5],
         *          equip: {
         *              hands: gloves,
         *              head: hat,
         *          },
         *      }
         * 
         *      const template = {
         *          level: value => handleLevel(value),
         *          class: value => setClass(value),
         *          stats: value => stats.forEach(stat => handleStat(stat)),
         *          equip: value => {
         *              equip(value.hands)
         *              equip(value.hat)
         *          },
         *      }
         * 
         *      stateManager.template(template, t => console.log(t) )
         *      console.log( stateManager.template() )
         */
        this.template = (template, callback) => {
            if (template) {
                dev.start('set template:', template)
                const success = _private.template(template, callback)
                dev.end(success, null, _ => dev.error('Unable to set template.'))
            }
            return deepCopy(_state.template)
        }

        /**
         * Get/set the store. The store is the array containing saved states.
         * @param {array=} store - Array containing saved state objects.
         * @param {function=} callback - The returned store is also passed as a parameter to the callback.
         * @notes The value will be stored as a deep copy with no references.
         * @returns {array} The newly copied value.
         * @error Fails if the store parameter is not an array.
         * @example
         *      
         *      const store = [state1, state2, state3, state4]
         *      stateManager.store(store, s => console.log(s) )
         *      console.log( stateManager.store() )
         */
        this.store = (store, callback) => {
            if (store) {
                dev.start('set store: ', store)
                const success = _private.store(store, callback)
                dev.end(success, null, _ => dev.error('Unable to set store.\n Must be an Array.'))
            }
            return deepCopy(_state.store)
        }

        this.localStorage = {
            /**
             * Store the KDStateManager instance's `template`, `store`, and `currentIndex` in local storage.
             * @param {string} key - The key to store under.
             * @param {function=} callback - Success is passed to the callback as `true`/`false`.
             * @returns {boolean}
             * @example
             * 
             *      stateManager.localStorage.set('history1', s => console.log(s))
             *      
             */
            set: (key, callback) => {
                dev.start('localStorage SET: ', key)
                const success = _private.localStorage.set(key, callback)
                dev.end(success, null, _ => dev.error('Unable to save to localStorage.'))
            },
            /**
             * Get a saved KDStateManager `template`, `store`, and `currentIndex` from local storage.
             * @param {string} key - The target ket.
             * @param {function=} callback - The returned state is also passed as a parameter to the callback.
             * @notes Returns the retrieved object on success, but also automatically updates the instance with the retrieved values.
             * @returns {object} The retrieved object.
             * @example
             * 
             *      stateManager.localStorage.get('history1', s => console.log(s))
             *      
             */
            get: (key, callback) => {
                dev.start('localStorage GET: ', key)
                const success = _private.localStorage.get(key, callback)
                dev.end(success, null, _ => dev.error('Unable to retrieve from localStorage.'))
            },
        }

        /**
         * Add a state to the end of the store stack.
         * @param {object} state - A state object should consist of keys that match some if not all keys in the template.
         * @param {function=} callback - Returns the stored state.
         * @notes The value will be stored as a deep copy with no references.
         * @returns {object} The newly copied and stored state.
         * @example
         * 
         *      const state = {
         *          'name': 'Named',
         *          'attribute: 'generic',
         *      }
         * 
         *      stateManager.append(state, s => console.log(s) )
         */
        this.append = (state, callback) => {
            dev.start('append:', state)
            const success = _private.append(state, callback)
            dev.end(success)
            return success
        }

        /**
         * Recall a stored state at a specific index. Recalling a state will attempt to match keys in the state with keys
         * in the template. Where matches are found, the state value is passed to the template function. Also updates the
         * `currentIndex` to the recalled index.
         * @param {number} index - The desired index to recall.
         * @param {function=} callback - Returns the recalled state.
         * @notes The value will be recalled as a deep copy with no references.
         * @returns {object} The newly copied and recalled state.
         * @error Fails if the index is invalid.
         * @example
         * 
         *      const template = {
         *          level: value => handleLevel(value),
         *          title: value => setTitle(value),
         *          stats: value => stats.forEach(stat => handleStat(stat)),
         *          equip: value => {
         *              equip(value.hands)
         *              equip(value.hat)
         *          },
         *      }
         * 
         *      stateManager.template(template)
         *      stateManager.append(state)
         *      stateManager.append(state)
         *  
         *      stateManager.recall(0, s => console.log(s) )
         */
        this.recall = (index, callback) => {
            dev.start('recall index: ' + index)
            const success = _private.recall(index, callback)
            dev.end(success, null, _ => dev.error('Unable to recall.\n Invalid index (' + index + ').'))
            return success
        }

        /**
         * Delete a stored state at a specific index. Deleting a state completely deletes the index. Other indices will be
         * shifted.
         * @param {number} index - The desired index to delete.
         * @param {function=} callback - Returns the deleted state.
         * @returns {object} The deleted state.
         * @error Fails if the index is invalid.
         * @example
         * 
         *      stateManager.delete(0, s => console.log(s) )
         */
        this.delete = (index, callback) => {
            dev.start('delete index: ' + index)
            const success = _private.delete(index, callback)
            dev.end(success, null, _ => dev.error('Unable to delete.\n Invalid index (' + index + ').'))
        }

        /**
         * Insert a state at a specific index. The state will be placed at the requested index and other states will be shifted.
         * @param {number} index - The index where the state should be inserted.
         * @param {object} state - The target state object.
         * @param {function=} callback - Returns the inserted state.
         * @notes The value will be stored as a deep copy with no references.
         * @returns {object} The newly copied and inserted state.
         * @error Fails if the index is invalid.
         * @example
         * 
         *      stateManager.insert(1, state, s => console.log(s) )
         */
        this.insert = (index, state, callback) => {
            dev.start('insert at index: ' + index)
            const success = _private.insert(index, state, callback)
            dev.end(success, null, _ => dev.error('Unable to insert at index ' + index + '.\n Invalid index (' + index + ').'))
        }

        /**
         * Replace a state at a specific index. The existing state will be deleted and the new state placed at the requested index.
         * @param {number} index - The index where the replacement should occur.
         * @param {object} state - The new state object.
         * @param {function=} callback - Returns the newly inserted state.
         * @notes The value will be stored as a deep copy with no references.
         * @returns {object} The newly copied and inserted state.
         * @error Fails if the index is invalid.
         * @example
         * 
         *      stateManager.replace(1, state, s => console.log(s) )
         */
        this.replace = (index, state, callback) => {
            dev.start('replace state at index: ' + index)
            const success = _private.replace(index, state, callback)
            dev.end(success, null, _ => dev.error('Unable to replace at index ' + index + '.\n Invalid index (' + index + ').'))
        }

        /** 
         * Recall the state at the index one before `currentIndex`.
         * @param {function=} callback - Returns the recalled state.
         * @notes The value will be recalled as a deep copy with no references.
         * @returns {object} The newly copied and recalled state.
         * @error Fails if the index is invalid.
         * @example
         *      
         *      stateManager.append(prevState)
         *      stateManager.append(state)
         *      stateManager.undo(s => console.log( s == prevState ))
         */
        this.undo = callback => {
            dev.start('undo to index: ' + (this.index.current() - 1) + ' out of ' + this.index.last())
            const success = _private.undo(callback)
            dev.end(success, null, _ => dev.error('Unable to undo.\n Invalid index (' + (_state.currentIndex - 1) + ').'))
        }

        /** 
         * Recall the state at the index one after `currentIndex`.
         * @param {function=} callback - Returns the recalled state.
         * @notes The value will be recalled as a deep copy with no references.
         * @returns {object} The newly copied and recalled state.
         * @error Fails if the index is invalid.
         * @example
         *      
         *      stateManager.append(prevState)
         *      stateManager.append(state)
         *      stateManager.undo(s => console.log( s == prevState ))
         *      stateManager.redo(s => console.log( s == state ))
         */
        this.redo = callback => {
            dev.start('redo to index: ' + (this.index.current() + 1) + ' out of ' + this.index.last())
            const success = _private.redo(callback)
            dev.end(success, null, _ => dev.error('Unable to redo.\n Invalid index (' + (_state.currentIndex + 1) + ').'))
        }

    }
}