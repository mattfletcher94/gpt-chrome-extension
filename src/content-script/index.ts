import { defineRouter, defineRoute, createHandler } from './../tcrpc'
import { z } from 'zod'


chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log(request);
  if (request.action === 'getBody') {
    const body = document.body.innerHTML;
    console.log('body', body);
    sendResponse(document.body);
  }
});

/*
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (!request.WRPC) return;

  const response = await wrpc.handleMessage({
    WRPC: request.WRPC,
    ctx: {},
  });

  sendResponse(response);
});*/

// Also export the router type for use on the client
 
  