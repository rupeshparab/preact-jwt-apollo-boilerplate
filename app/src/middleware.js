import { refreshToken, logoutUser } from './reducers/auth.service';

let buffer = [];

export const jwt = store => next => action => {
	buffer.push(action);
	if (action.type === 'INVALID_TOKEN') {
		let theStore = store.getState();
		if (
			theStore.auth &&
			theStore.auth.authToken &&
			theStore.auth.refreshToken
		) {
			if (!theStore.auth.pendingRefreshingToken) {
				store.dispatch({ type: 'REFRESHING_TOKEN' });
				store.dispatch(refreshToken(theStore.auth.refreshToken)).then(resp => {
					store.dispatch({ type: 'TOKEN_REFRESHED' });

					//get the action before the last INVALID_TOKEN (the one which got denied because of token expiration)
					//TODO - test when there are multiple INVALID_TOKEN instances in action buffer
					let pos = buffer.map(e => e.type).indexOf('INVALID_TOKEN') - 1;
					let previousRequest = buffer[pos];
					if (typeof previousRequest === 'function') previousRequest();
					buffer = [];
				});
			}
		}
	}
	else if (action.type === 'REFRESH_EXPIRED') {
		buffer = [];
		logoutUser('refreshExpired');
	}
	else {
		if (buffer.length > 20) {
			//remove all items but keep the last 20 which forms the buffer
			buffer.splice(0, buffer.length - 20);
		}
		return next(action);
	}
};
