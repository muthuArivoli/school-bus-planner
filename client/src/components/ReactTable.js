import * as React from 'react';
import tableStyle from './tablestyle.css';
import { useTable, useSortBy, useFilters, usePagination, ReactTable } from 'react-table'; 

export const Table= ({columns,data, manualPagination = false, totalRows, rowsPerPage}) => {

    const controlledPageCount = Math.ceil(totalRows/rowsPerPage); 
    
    const{
      getTableProps,
      getTableBodyProps,
      headerGroups,
      //rows,
      prepareRow,
      page,
      canPreviousPage,
      canNextPage,
      pageOptions,
      pageCount,
      gotoPage,
      nextPage,
      previousPage,
      setPageSize,
      state: {pageIndex, pageSize},
    } = useTable({columns, data, initialState: {pageIndex: 0}},  useFilters, useSortBy, usePagination);
    
    //useTable({columns, data, initialState: {pageIndex: 0}, pageCount: controlledPageCount},  useFilters, useSortBy, usePagination,manualPagination);
    //page: array of rows for current page 
    
    const [currentPage, setCurrentPage] = React.useState(0);
    
    //   const {
    //     isLoading,
    //     isError,
    //     error,
    //     data,
    //     isFetching,
    //    isPreviousData,
    //   } = useQuery(,{keepPreviousData: true})
    
    //const pageCount = Math.ceil(totalRows/rowsPerPage);
    
    return (
       <>
       <table {...getTableProps()}>
         <thead>
           {headerGroups.map(headerGroup => (
             < tr {...headerGroup.getHeaderGroupProps()}>
               {headerGroup.headers.map(column => (
                 < th {...column.getHeaderProps()}>{column.render('Header')} </th>
               ))}
             </tr>
           ))}
         </thead>
         <tbody {...getTableBodyProps()}>
           {/* rows to page */}
           {page.map((row, i) => {
             prepareRow(row)
             return (
               <tr {...row.getRowProps()}>
                 {row.cells.map(cell => {
                   return <td {...cell.getCellProps()}>
                     {/* <Link component={RouterLink} to={"/schools/" + params.value.id}>{params.value.name}</Link>*/}
                     {cell.render('Cell')}</td> 
                 })}
               </tr>
             )
           })}
    {/*        <tr>
             <td>
               {page.length} of {controlledPageCount*pageSize}
             </td>
           </tr> */}
         </tbody>
       </table>
    
        <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>{' '}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>{' '}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>{' '}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>{' '}
        <span>
          Page{' '}
          <strong>
            {pageIndex + 1} of {pageCount}
          </strong>{' '}
        </span>
        <span>
          | Go to page:{' '}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0
              gotoPage(page)
            }}
            style={{ width: '100px' }}
          />
        </span>{' '}
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value))
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
        </div>
      </>
    )
    
}
    