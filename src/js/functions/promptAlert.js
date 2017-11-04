const promptAlert = (title,text,success,cancel,fn)=>{
    sweetAlert({
      title: title,
      text: text,
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, do it!',
      cancelButtonText: 'No, cancel!',
      confirmButtonClass: 'btn btn-success',
      cancelButtonClass: 'btn btn-danger',
      buttonsStyling: false
    }).then(function () {
      
      fn();
    
      sweetAlert(
        'Success!',
        success,
        'success'
      )
    }, function (dismiss) {
      // dismiss can be 'cancel', 'overlay',
      // 'close', and 'timer'
      if (dismiss === 'cancel') {
        sweetAlert(
          'Cancelled',
          cancel,
          'error'
        )
      }
    })        
            
    }

module.exports = promptAlert;