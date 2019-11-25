# KDStateManagerJS  
v1.0 | © justKD 2019  

Class representing a manager for storing and recalling JSON objects representing state values.  

The template is an object of keyed functions that should operate on an expected value/type.  

A state is an object of keys (and any values) that correspond with templated keys.  

When a state is recalled, if any keys in the recalled state match keys in the template, the state value will be passed to the templated function.  

Store by inserting or appending a state, recall or delete a state by index, infinite undo/redo.  

## Install
via CDN:  
https://cdn.jsdelivr.net/gh/justKD/KDStateManagerJS/KDStateManager.min.js

## Basic Use
```
const stateManager = new KDStateManager({
    param1: value => handleParam1(value),
    param2: value => handleParam2(value),
    param3: value => handleParam3(value),
}, {
    dev: true, // optional parameter to activate detailed logging
})

const state1 = {
    param1: 1,
    param2: 'two',
    param3: [3],
}

const state2 = {
    param1: 'one',
    param2: [2],
    param3: 3,
}

stateManager.append(state1)
stateManager.append(state2, s => console.log(s) )

stateManager.undo(s => console.log( s == state1 ))
stateManager.redo(s => console.log( s == state2 ))
stateManager.recall(0, s => console.log( s == state1 ))

```

## Extended Use
```
const stateManager = new KDStateManager({
    param1: value => handleParam1(value),
    param2: value => handleParam2(value),
    param3: value => handleParam3(value),
}, {
    dev: true, // optional parameter to activate detailed logging
})

const state1 = {
    param1: 1,
    param2: 'two',
    param3: [3],
}

const state2 = {
    param1: 'one',
    param2: [2],
    param3: 3,
}

stateManager.append(state1)

const savedStore = stateManager.store()

stateManager.append(state2)

const newStateManager = new KDStateManager(stateManager.template(), {
    store: savedStore,
    currentIndex: 0,
})

newStateManager.onError(e => alert(e))

newStateManager.append(state2)
newStateManager.insert(0, {
    param1: [1],
    param2: 2,
    param3: 'three',
})

newStateManager.delete(1)
newStateManager.replace(0, state1)
newStateManager.recall(0)

```

<!-- Example:  
[KDMetronome on CodePen](https://codepen.io/justKD/pen/MWWYQBr) -->

## API

```
.devMode(on)                               // Toggle detailed console logging for the instance.
.onError(e => {})                          // Set a custom error handling function.

.index.set(index)                          // Set the `currentIndex` value used by the `undo` and `redo` methods.
.index.current()                           // Get the `currentIndex` value.
.index.last()                              // Get the last index value (store.length - 1)
.index.first()                             // Get the first index value (0). Convenience function to match `.last()`.

.template(template, callback)              // Get/set the template. `template` is both returned and passed to the callback on success, `false` on fail. Optional callback.
.store(store, callback)                    // Get/set the array of stored states. `store` is both returned and passed to the callback on success, `false` on fail. Optional callback.
.localStorage.set(key, callback)           // Store the KDStateManager instance's `template`, `store`, and `currentIndex` in local storage using the key `key`. Success bool is both returned and passed to the callback on success. Optional callback.
.localStorage.get(key, callback)           // Retrieve a stored KDStateManager state from local storage using the key `key`.  Retrieved object is both returned and passed to the callback on success, `false` on fail. Optional callback.

.append(state, callback)                   // Add a new state to the end of the store array. Appended state is both returned and passed to the callback on success, `false` on fail. Optional callback.
.recall(index, callback)                   // Recall a stored state at a specific index. Recalling a state will attempt to match keys in the state with keys in the template. Where matches are found, the state value is passed to the template function. Also updates the `currentIndex` to the recalled index. Recalled state is both returned and passed to the callback on success, `false` on fail. Optional callback.
.delete(index, callback)                   // Delete a stored state at a specific index. Deleting a state completely deletes the index. Other indices will be shifted. The deleted state is both returned and passed to the callback on success, `false` on fail. Optional callback.
.insert(index, state, callback)            // Insert a state at the requested index. Inserted state is both returned and passed to the callback on success, `false` on fail. Optional callback.
.replace(index, state, callback)           // Replace a state at the requested index. Inserted state is both returned and passed to the callback on success, `false` on fail. Optional callback.

.undo(callback)                            // Recalls the state at the index `currentIndex - 1` and sets `currentIndex` to the new index. Recalled state is both returned and passed to the callback on success, `false` on fail. Optional callback.
.redo(callback)                            // Recalls the state at the index `currentIndex + 1` and sets `currentIndex` to the new index. Recalled state is both returned and passed to the callback on success, `false` on fail. Optional callback.
```