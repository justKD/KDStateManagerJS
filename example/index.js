// Open the browser console to trace the series of commands below.

let state = {
    'prop1': '',
    'prop2': '',
    'prop3': '',
}

let state1 = {
    'prop1': 'one',
    'prop2': 101010,
    'prop3': [1, 1, 'one'],
}

let state2 = {
    'prop1': 'two',
    'prop2': 20202,
    'prop3': [2, 2, 'two'],
}

let state3 = {
    'prop1': 'three',
    'prop2': 30303,
    'prop3': [3, 3, 'three'],
}

let state4 = {
    'prop1': 'four',
    'prop2': 40404,
    'prop3': [4, 4, 'four'],
}

const history = new KDStateManager({
    'prop1': value => {
        state.prop1 = value
    },
    'prop2': value => {
        state.prop2 = value
    },
    'prop3': value => {
        state.prop3 = value
    },
}, {
    dev: true,
    //store: null,
    //currentIndex: null,
})

//history.onError(e => console.log(e))

history.append(state2, _ => console.log(history.store()))
history.append(state3, _ => console.log(history.store()))

const store = history.store()

history.recall(1, _ => console.log(state))
history.recall(0, _ => console.log(state))

history.delete(1, _ => console.log(history.store()))

history.insert(0, state1)
history.insert(2, state3)
history.insert(3, state4, success => {
    if (success) console.log('successed')
    else console.log('not successed')
    console.log(history.store())
})

history.index.last()

history.recall(history.index.last(), _ => console.log(state))

history.undo(_ => console.log(state))
history.redo(_ => console.log(state))
history.undo(_ => console.log(state))
history.undo(_ => console.log(state))
history.undo(_ => console.log(state))
history.redo(_ => console.log(state))
history.undo(_ => {
    console.log(history.index.current())
    console.log(state)
})

history.recall(1, _ => {
    console.log(state)
    console.log(history.index.current())
})

history.store(store, _ => {
    console.log(history.store())
})

history.replace(1, state4, _ => console.log(history.store()))

history.store(store, _ => {
    console.log(history.store())
})

